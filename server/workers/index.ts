/**
 * Worker Registry
 * ===============
 * Initializes and manages all BullMQ workers.
 * Workers are started conditionally based on ENABLE_WORKERS env var.
 * In production, workers run in a separate process from the API server.
 */

import { Worker } from "bullmq";
import { createOrderLifecycleWorker } from "./order-lifecycle.js";
import { createSettlementWorker } from "./settlement-processing.js";
import { createLabelGenerationWorker } from "./label-generation.js";
import { createTrackingUpdateWorker } from "./tracking-update.js";
import { createShopifySyncWorker } from "./shopify-sync.js";
import { createCatalogEnrichmentWorker } from "./catalog-enrichment.js";

const workers: Worker[] = [];

export function startAllWorkers(): void {
  console.log("[workers] Starting all BullMQ workers...");

  workers.push(createOrderLifecycleWorker());
  workers.push(createSettlementWorker());
  workers.push(createLabelGenerationWorker());
  workers.push(createTrackingUpdateWorker());
  workers.push(createShopifySyncWorker());
  workers.push(createCatalogEnrichmentWorker());

  console.log(`[workers] ✅ ${workers.length} workers started`);
}

export async function stopAllWorkers(): Promise<void> {
  console.log("[workers] Stopping all workers...");

  await Promise.all(workers.map((w) => w.close()));
  workers.length = 0;

  console.log("[workers] ✅ All workers stopped");
}

export function getWorkerCount(): number {
  return workers.length;
}
