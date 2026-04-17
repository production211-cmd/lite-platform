/**
 * Order Lifecycle Worker
 * ======================
 * Database-as-state-store pattern (NOT XState).
 *
 * Flow:
 * 1. Read current VendorOrder status from DB
 * 2. Validate transition is legal via state machine
 * 3. Execute side effect (if any)
 * 4. Write new status atomically in Prisma transaction
 * 5. Derive and update MarketplaceOrder aggregate status
 *
 * Illegal transitions → throw → job goes to dead-letter queue.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  validateVendorOrderTransition,
  deriveMarketplaceOrderStatus,
  type VendorOrderStatus,
} from "../lib/state-machines/order.js";
import { QUEUE_NAMES, redisConnection, type OrderLifecycleJob } from "../queues/index.js";

const prisma = new PrismaClient();

// ============================================================
// Side Effects Per Transition
// ============================================================

type SideEffectFn = (
  prisma: PrismaClient,
  vendorOrderId: string,
  metadata?: Record<string, any>
) => Promise<void>;

const SIDE_EFFECTS: Partial<Record<string, SideEffectFn>> = {
  // When vendor accepts, record acceptance timestamp
  "PLACED→VENDOR_ACCEPT": async (prisma, vendorOrderId) => {
    await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { acceptedAt: new Date() },
    });
  },

  // When vendor rejects, record rejection
  "PLACED→VENDOR_REJECTED": async (prisma, vendorOrderId, metadata) => {
    await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: metadata?.reason || "No reason provided",
      },
    });
  },

  // When shipped, record ship date
  "GENERATE_LABEL→SHIPPED": async (prisma, vendorOrderId) => {
    await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { shippedAt: new Date() },
    });
  },

  // When delivered, record delivery date
  "IN_TRANSIT→DELIVERED": async (prisma, vendorOrderId) => {
    await prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { deliveredAt: new Date() },
    });
  },
};

// ============================================================
// Worker Processor
// ============================================================

async function processOrderLifecycle(job: Job<OrderLifecycleJob>) {
  const { vendorOrderId, targetStatus, triggeredBy, metadata } = job.data;

  job.log(`Processing transition for VendorOrder ${vendorOrderId} → ${targetStatus}`);

  // Step 1: Read current status from DB (source of truth)
  const vendorOrder = await prisma.vendorOrder.findUnique({
    where: { id: vendorOrderId },
    select: { id: true, status: true, orderId: true },
  });

  if (!vendorOrder) {
    throw new Error(`VendorOrder ${vendorOrderId} not found`);
  }

  const currentStatus = vendorOrder.status as VendorOrderStatus;
  const target = targetStatus as VendorOrderStatus;

  // Step 2: Validate transition
  const result = validateVendorOrderTransition(currentStatus, target);

  if (!result.valid) {
    // Illegal transition → throw → dead-letter queue
    throw new Error(
      `${result.error}. Allowed: [${result.allowedTransitions?.join(", ")}]`
    );
  }

  // Step 3: Execute side effect (if any)
  const sideEffectKey = `${currentStatus}→${target}`;
  const sideEffect = SIDE_EFFECTS[sideEffectKey];
  if (sideEffect) {
    await sideEffect(prisma, vendorOrderId, metadata);
  }

  // Step 4: Write new status atomically
  await prisma.$transaction(async (tx) => {
    // Update VendorOrder status
    await tx.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { status: target },
    });

    // Step 5: Derive and update MarketplaceOrder aggregate status
    const allVendorOrders = await tx.vendorOrder.findMany({
      where: { orderId: vendorOrder.orderId },
      select: { status: true },
    });

    const aggregateStatus = deriveMarketplaceOrderStatus(
      allVendorOrders.map((vo) => vo.status as VendorOrderStatus)
    );

    await tx.marketplaceOrder.update({
      where: { id: vendorOrder.orderId },
      data: { status: aggregateStatus },
    });
  });

  job.log(
    `✅ VendorOrder ${vendorOrderId}: ${currentStatus} → ${target} (triggered by ${triggeredBy})`
  );

  return { success: true, from: currentStatus, to: target };
}

// ============================================================
// Worker Instance
// ============================================================

export function createOrderLifecycleWorker() {
  const worker = new Worker(
    QUEUE_NAMES.ORDER_LIFECYCLE,
    processOrderLifecycle,
    {
      connection: redisConnection,
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`[order-lifecycle] ✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[order-lifecycle] ❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[order-lifecycle] Worker error:", err);
  });

  return worker;
}
