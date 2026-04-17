/**
 * Shopify Sync Worker
 * ===================
 * Fixed to match actual Prisma schema field names.
 * SyncCursorLog uses: integrationType, cursorType, lastCursorValue, itemsSynced
 * ShopifyWebhookLog uses: rawPayload, shopDomain
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  QUEUE_NAMES,
  redisConnection,
  type ShopifySyncJob,
} from "../queues/index.js";

const prisma = new PrismaClient();

// ============================================================
// Webhook Deduplication
// ============================================================

async function isWebhookDuplicate(webhookId: string): Promise<boolean> {
  if (!webhookId) return false;
  const existing = await prisma.shopifyWebhookLog.findFirst({
    where: { externalId: webhookId },
  });
  return !!existing;
}

async function logWebhook(
  vendorId: string,
  webhookId: string,
  topic: string,
  rawPayload: any
): Promise<void> {
  await prisma.shopifyWebhookLog.create({
    data: {
      vendorId,
      externalId: webhookId,
      topic,
      rawPayload,
      status: "success",
    },
  });
}

// ============================================================
// Sync Cursor Management
// ============================================================

async function getSyncCursor(
  vendorId: string,
  cursorType: string
): Promise<string | null> {
  const log = await prisma.syncCursorLog.findFirst({
    where: { vendorId, cursorType },
    orderBy: { createdAt: "desc" },
  });
  return log?.lastCursorValue || null;
}

async function updateSyncCursor(
  vendorId: string,
  cursorType: string,
  lastCursorValue: string,
  itemsSynced: number
): Promise<void> {
  await prisma.syncCursorLog.upsert({
    where: {
      vendorId_integrationType_cursorType: {
        vendorId,
        integrationType: "SHOPIFY",
        cursorType,
      },
    },
    create: {
      vendorId,
      integrationType: "SHOPIFY",
      cursorType,
      lastCursorValue,
      itemsSynced,
      lastSyncAt: new Date(),
    },
    update: {
      lastCursorValue,
      itemsSynced: { increment: itemsSynced },
      lastSyncAt: new Date(),
    },
  });
}

// ============================================================
// Sync Processors (Stubs)
// ============================================================

async function syncProducts(vendorId: string, cursor?: string): Promise<{ newCursor?: string; count: number }> {
  console.log(`[shopify-sync] Syncing products for vendor ${vendorId} from cursor ${cursor}`);
  return { count: 0 };
}

async function syncOrders(vendorId: string, cursor?: string): Promise<{ newCursor?: string; count: number }> {
  console.log(`[shopify-sync] Syncing orders for vendor ${vendorId} from cursor ${cursor}`);
  return { count: 0 };
}

async function syncInventory(vendorId: string, cursor?: string): Promise<{ newCursor?: string; count: number }> {
  console.log(`[shopify-sync] Syncing inventory for vendor ${vendorId} from cursor ${cursor}`);
  return { count: 0 };
}

// ============================================================
// Worker Processor
// ============================================================

async function processShopifySync(job: Job<ShopifySyncJob>) {
  const { vendorId, syncType, webhookId } = job.data;

  job.log(`Processing Shopify ${syncType} sync for vendor ${vendorId}`);

  // Webhook deduplication
  if (webhookId) {
    const isDuplicate = await isWebhookDuplicate(webhookId);
    if (isDuplicate) {
      job.log(`Webhook ${webhookId} already processed (deduplicated)`);
      return { success: true, deduplicated: true };
    }
  }

  // Get sync cursor
  const cursor = job.data.cursor || (await getSyncCursor(vendorId, syncType)) || undefined;

  let result: { newCursor?: string; count: number };

  switch (syncType) {
    case "products":
      result = await syncProducts(vendorId, cursor);
      break;
    case "orders":
      result = await syncOrders(vendorId, cursor);
      break;
    case "inventory":
      result = await syncInventory(vendorId, cursor);
      break;
    case "full":
      const [products, orders, inventory] = await Promise.all([
        syncProducts(vendorId, cursor),
        syncOrders(vendorId, cursor),
        syncInventory(vendorId, cursor),
      ]);
      result = {
        count: products.count + orders.count + inventory.count,
        newCursor: products.newCursor || orders.newCursor || inventory.newCursor,
      };
      break;
    default:
      throw new Error(`Unknown sync type: ${syncType}`);
  }

  // Update sync cursor
  if (result.newCursor) {
    await updateSyncCursor(vendorId, syncType, result.newCursor, result.count);
  }

  // Log webhook if applicable
  if (webhookId) {
    await logWebhook(vendorId, webhookId, `shopify/${syncType}`, { count: result.count });
  }

  job.log(`✅ Synced ${result.count} items for vendor ${vendorId}`);
  return { success: true, count: result.count };
}

// ============================================================
// Worker Instance
// ============================================================

export function createShopifySyncWorker() {
  const worker = new Worker(
    QUEUE_NAMES.SHOPIFY_SYNC,
    processShopifySync,
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[shopify-sync] ✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[shopify-sync] ❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
