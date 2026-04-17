/**
 * Label Generation Worker
 * =======================
 * Generates shipping labels via carrier APIs (FedEx, DHL, UPS).
 * Fixed to match actual Prisma schema field names.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  QUEUE_NAMES,
  redisConnection,
  type LabelGenerationJob,
} from "../queues/index.js";

const prisma = new PrismaClient();

// ============================================================
// Carrier API Stubs
// ============================================================

interface LabelResult {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
}

async function generateFedExLabel(data: LabelGenerationJob): Promise<LabelResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    trackingNumber: `FX${Date.now()}`,
    labelUrl: `https://labels.fedex.com/${Date.now()}.pdf`,
  };
}

async function generateDHLLabel(data: LabelGenerationJob): Promise<LabelResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    trackingNumber: `DHL${Date.now()}`,
    labelUrl: `https://labels.dhl.com/${Date.now()}.pdf`,
  };
}

async function generateUPSLabel(data: LabelGenerationJob): Promise<LabelResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    success: true,
    trackingNumber: `1Z${Date.now()}`,
    labelUrl: `https://labels.ups.com/${Date.now()}.pdf`,
  };
}

const CARRIER_HANDLERS: Record<string, (data: LabelGenerationJob) => Promise<LabelResult>> = {
  FEDEX: generateFedExLabel,
  DHL: generateDHLLabel,
  UPS: generateUPSLabel,
};

// ============================================================
// Worker Processor
// ============================================================

async function processLabelGeneration(job: Job<LabelGenerationJob>) {
  const { vendorOrderId, carrier, idempotencyKey } = job.data;

  job.log(`Generating ${carrier} label for VendorOrder ${vendorOrderId}`);

  // Idempotency check
  const existing = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existing?.status === "COMPLETED") {
    job.log(`Label already generated (idempotent): ${JSON.stringify(existing.responseData)}`);
    return { success: true, cached: true, response: existing.responseData };
  }

  // Acquire idempotency key
  try {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        scope: "label-generation",
        status: "PROCESSING",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      job.log("Label generation already in progress");
      return { success: true, inProgress: true };
    }
    throw err;
  }

  // Generate label
  const handler = CARRIER_HANDLERS[carrier];
  if (!handler) {
    throw new Error(`Unsupported carrier: ${carrier}`);
  }

  try {
    const result = await handler(job.data);

    if (!result.success) {
      throw new Error(result.error || "Label generation failed");
    }

    // Create shipment and log atomically
    await prisma.$transaction(async (tx) => {
      const vendorOrder = await tx.vendorOrder.findUnique({
        where: { id: vendorOrderId },
        select: { vendorId: true },
      });

      if (!vendorOrder) throw new Error("VendorOrder not found");

      await tx.shipment.create({
        data: {
          vendorOrderId,
          vendorId: vendorOrder.vendorId,
          shippingModel: "DTC_B",
          carrier,
          leg: "DIRECT",
          status: "LABEL_CREATED",
          trackingNumber: result.trackingNumber!,
          labelUrl: result.labelUrl,
          shippingCost: 0,
          costCurrency: "USD",
        },
      });

      // Log the label generation
      await tx.labelGenerationLog.create({
        data: {
          vendorOrderId,
          trackingNumber: result.trackingNumber!,
          action: "generated",
          carrier,
          labelUrl: result.labelUrl,
        },
      });

      // Update VendorOrder status
      await tx.vendorOrder.update({
        where: { id: vendorOrderId },
        data: { status: "GENERATE_LABEL" },
      });
    });

    // Mark idempotency key completed
    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: {
        status: "COMPLETED",
        responseData: { trackingNumber: result.trackingNumber, labelUrl: result.labelUrl },
        completedAt: new Date(),
      },
    });

    job.log(`✅ Label generated: ${result.trackingNumber}`);
    return { success: true, trackingNumber: result.trackingNumber };
  } catch (err: any) {
    await prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: { status: "FAILED", responseData: { error: err.message } },
    });

    // Log the failure
    await prisma.labelGenerationLog.create({
      data: {
        vendorOrderId,
        action: "failed",
        carrier,
        reason: err.message,
      },
    });

    throw err;
  }
}

// ============================================================
// Worker Instance
// ============================================================

export function createLabelGenerationWorker() {
  const worker = new Worker(
    QUEUE_NAMES.LABEL_GENERATION,
    processLabelGeneration,
    {
      connection: redisConnection,
      concurrency: 5,
      // Hardened settings per audit
      lockDuration: 30_000,         // 30s lock — carrier API calls can be slow
      stalledInterval: 15_000,      // Check for stalled jobs every 15s
      maxStalledCount: 2,           // Mark as stalled after 2 missed heartbeats
      metrics: { maxDataPoints: 1000 }, // Enable BullMQ metrics
    }
  );

  worker.on("completed", (job) => {
    console.log(`[label-gen] ✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[label-gen] ❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[label-gen] ⚠️ Job ${jobId} stalled — will be retried`);
  });

  return worker;
}
