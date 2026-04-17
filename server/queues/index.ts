/**
 * BullMQ Queue Infrastructure
 * ===========================
 * Central queue registry for all async workflows.
 * Each queue handles a specific domain concern.
 *
 * Queue Types:
 * - order-lifecycle: VendorOrder state transitions
 * - shopify-sync: Shopify product/order sync
 * - label-generation: Shipping label creation (FedEx, DHL, UPS)
 * - tracking-update: Carrier tracking polling
 * - settlement-processing: Revolut payout execution
 * - catalog-enrichment: AI-powered product enrichment
 */

import { Queue, QueueEvents, type ConnectionOptions } from "bullmq";

// ============================================================
// Redis Connection
// ============================================================

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redisConnection: ConnectionOptions = {
  host: new URL(REDIS_URL).hostname || "localhost",
  port: parseInt(new URL(REDIS_URL).port || "6379"),
  maxRetriesPerRequest: null,
};

// ============================================================
// Queue Definitions
// ============================================================

export const QUEUE_NAMES = {
  ORDER_LIFECYCLE: "order-lifecycle",
  SHOPIFY_SYNC: "shopify-sync",
  LABEL_GENERATION: "label-generation",
  TRACKING_UPDATE: "tracking-update",
  SETTLEMENT_PROCESSING: "settlement-processing",
  CATALOG_ENRICHMENT: "catalog-enrichment",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ============================================================
// Job Data Types
// ============================================================

export interface OrderLifecycleJob {
  vendorOrderId: string;
  targetStatus: string;
  triggeredBy: string; // userId or "system"
  metadata?: Record<string, any>;
}

export interface ShopifySyncJob {
  vendorId: string;
  syncType: "products" | "orders" | "inventory" | "full";
  cursor?: string;
  webhookId?: string; // For deduplication
}

export interface LabelGenerationJob {
  vendorOrderId: string;
  carrier: "FEDEX" | "DHL" | "UPS";
  shipFromAddress: Record<string, any>;
  shipToAddress: Record<string, any>;
  packages: Array<{
    weight: number;
    dimensions: { length: number; width: number; height: number };
  }>;
  idempotencyKey: string;
}

export interface TrackingUpdateJob {
  shipmentId: string;
  trackingNumber: string;
  carrier: "FEDEX" | "DHL" | "UPS";
}

export interface SettlementProcessingJob {
  settlementId: string;
  vendorId: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  retryCount?: number;
}

export interface CatalogEnrichmentJob {
  productId: string;
  vendorId: string;
  enrichmentType: "description" | "attributes" | "seo" | "full";
}

// ============================================================
// Queue Factory
// ============================================================

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: {
            count: 1000,
            age: 7 * 24 * 60 * 60, // 7 days
          },
          removeOnFail: {
            count: 5000,
            age: 30 * 24 * 60 * 60, // 30 days
          },
        },
      })
    );
  }
  return queues.get(name)!;
}

// ============================================================
// Queue Event Listeners (for monitoring)
// ============================================================

const queueEvents = new Map<string, QueueEvents>();

export function getQueueEvents(name: QueueName): QueueEvents {
  if (!queueEvents.has(name)) {
    queueEvents.set(name, new QueueEvents(name, { connection: redisConnection }));
  }
  return queueEvents.get(name)!;
}

// ============================================================
// Graceful Shutdown
// ============================================================

export async function closeAllQueues(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  for (const [, queue] of queues) {
    closePromises.push(queue.close());
  }
  for (const [, events] of queueEvents) {
    closePromises.push(events.close());
  }

  await Promise.all(closePromises);
  queues.clear();
  queueEvents.clear();
}

// ============================================================
// Helper: Add job with standard options
// ============================================================

export async function addOrderLifecycleJob(data: OrderLifecycleJob) {
  return getQueue(QUEUE_NAMES.ORDER_LIFECYCLE).add(
    `transition-${data.vendorOrderId}`,
    data,
    { priority: 1 }
  );
}

export async function addShopifySyncJob(data: ShopifySyncJob) {
  return getQueue(QUEUE_NAMES.SHOPIFY_SYNC).add(
    `sync-${data.vendorId}-${data.syncType}`,
    data,
    {
      // Deduplicate: only one sync per vendor per type at a time
      jobId: `shopify-sync-${data.vendorId}-${data.syncType}`,
    }
  );
}

export async function addLabelGenerationJob(data: LabelGenerationJob) {
  return getQueue(QUEUE_NAMES.LABEL_GENERATION).add(
    `label-${data.vendorOrderId}`,
    data,
    {
      // Idempotent: same key = same job
      jobId: `label-${data.idempotencyKey}`,
    }
  );
}

export async function addTrackingUpdateJob(data: TrackingUpdateJob) {
  return getQueue(QUEUE_NAMES.TRACKING_UPDATE).add(
    `tracking-${data.shipmentId}`,
    data
  );
}

export async function addSettlementJob(data: SettlementProcessingJob) {
  return getQueue(QUEUE_NAMES.SETTLEMENT_PROCESSING).add(
    `settlement-${data.settlementId}`,
    data,
    {
      // Idempotent: same key = same job
      jobId: `settlement-${data.idempotencyKey}`,
      priority: 2,
    }
  );
}

export async function addCatalogEnrichmentJob(data: CatalogEnrichmentJob) {
  return getQueue(QUEUE_NAMES.CATALOG_ENRICHMENT).add(
    `enrich-${data.productId}`,
    data,
    { priority: 5 } // Low priority
  );
}
