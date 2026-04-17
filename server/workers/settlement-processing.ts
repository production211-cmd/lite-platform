/**
 * Settlement Processing Worker
 * ============================
 * Handles Revolut payout execution with idempotency.
 * Fixed to match actual Prisma schema field names.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  validateSettlementTransition,
  type SettlementStatus,
} from "../lib/state-machines/settlement.js";
import {
  QUEUE_NAMES,
  redisConnection,
  type SettlementProcessingJob,
} from "../queues/index.js";

const prisma = new PrismaClient();

// ============================================================
// Idempotency Guard
// ============================================================

interface IdempotencyResult {
  isNew: boolean;
  existingStatus?: string;
  existingResponse?: any;
}

async function acquireIdempotencyKey(
  key: string,
  scope: string
): Promise<IdempotencyResult> {
  try {
    await prisma.idempotencyKey.create({
      data: {
        key,
        scope,
        status: "PROCESSING",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return { isNew: true };
  } catch (err: any) {
    if (err.code === "P2002") {
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key },
      });
      if (existing) {
        return {
          isNew: false,
          existingStatus: existing.status,
          existingResponse: existing.responseData,
        };
      }
    }
    throw err;
  }
}

async function completeIdempotencyKey(
  key: string,
  responseData: any
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { key },
    data: {
      status: "COMPLETED",
      responseData,
      completedAt: new Date(),
    },
  });
}

async function failIdempotencyKey(
  key: string,
  error: string
): Promise<void> {
  await prisma.idempotencyKey.update({
    where: { key },
    data: {
      status: "FAILED",
      responseData: { error },
    },
  });
}

// ============================================================
// Revolut API Client (Stub)
// ============================================================

interface RevolutPaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

async function executeRevolutPayment(
  vendorId: string,
  amount: number,
  currency: string,
  idempotencyKey: string
): Promise<RevolutPaymentResult> {
  console.log(
    `[settlement] Executing Revolut payment: ${amount} ${currency} to vendor ${vendorId}`
  );
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    transactionId: `REV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  };
}

// ============================================================
// Worker Processor
// ============================================================

async function processSettlement(job: Job<SettlementProcessingJob>) {
  const { settlementId, vendorId, amount, currency, idempotencyKey } = job.data;

  job.log(`Processing settlement ${settlementId}: ${amount} ${currency}`);

  // Step 1: Idempotency guard
  const idempotency = await acquireIdempotencyKey(idempotencyKey, "settlement");

  if (!idempotency.isNew) {
    if (idempotency.existingStatus === "COMPLETED") {
      job.log(`Settlement ${settlementId} already completed (idempotent)`);
      return { success: true, cached: true, response: idempotency.existingResponse };
    }
    if (idempotency.existingStatus === "PROCESSING") {
      job.log(`Settlement ${settlementId} already being processed`);
      return { success: true, inProgress: true };
    }
  }

  // Step 2: Read current settlement status
  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement) {
    await failIdempotencyKey(idempotencyKey, "Settlement not found");
    throw new Error(`Settlement ${settlementId} not found`);
  }

  // Step 3: Validate transition to PROCESSING
  const transition = validateSettlementTransition(
    settlement.status as SettlementStatus,
    "PROCESSING"
  );

  if (!transition.valid) {
    await failIdempotencyKey(idempotencyKey, transition.error!);
    throw new Error(transition.error);
  }

  // Step 4: Mark as PROCESSING
  await prisma.settlement.update({
    where: { id: settlementId },
    data: { status: "PROCESSING", lastAttemptAt: new Date() },
  });

  await prisma.settlementEvent.create({
    data: {
      settlementId,
      fromStatus: settlement.status,
      toStatus: "PROCESSING",
      trigger: "system",
    },
  });

  // Step 5: Execute Revolut payment
  try {
    const result = await executeRevolutPayment(vendorId, amount, currency, idempotencyKey);

    if (result.success) {
      await prisma.$transaction(async (tx) => {
        await tx.settlement.update({
          where: { id: settlementId },
          data: {
            status: "COMPLETED",
            processorRef: result.transactionId,
            completedAt: new Date(),
          },
        });

        await tx.settlementEvent.create({
          data: {
            settlementId,
            fromStatus: "PROCESSING",
            toStatus: "COMPLETED",
            trigger: "system",
            processorRef: result.transactionId,
          },
        });
      });

      await completeIdempotencyKey(idempotencyKey, {
        transactionId: result.transactionId,
      });

      job.log(`✅ Settlement ${settlementId} completed: ${result.transactionId}`);
      return { success: true, transactionId: result.transactionId };
    } else {
      throw new Error(result.error || "Revolut payment failed");
    }
  } catch (err: any) {
    await prisma.$transaction(async (tx) => {
      await tx.settlement.update({
        where: { id: settlementId },
        data: {
          status: "FAILED",
          failedAt: new Date(),
          failureReason: err.message,
          retryCount: { increment: 1 },
        },
      });

      await tx.settlementEvent.create({
        data: {
          settlementId,
          fromStatus: "PROCESSING",
          toStatus: "FAILED",
          trigger: "system",
          errorMessage: err.message,
        },
      });
    });

    await failIdempotencyKey(idempotencyKey, err.message);
    throw err;
  }
}

// ============================================================
// Worker Instance
// ============================================================

export function createSettlementWorker() {
  const worker = new Worker(
    QUEUE_NAMES.SETTLEMENT_PROCESSING,
    processSettlement,
    {
      connection: redisConnection,
      concurrency: 5,
      limiter: { max: 20, duration: 1000 },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[settlement] ✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[settlement] ❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
