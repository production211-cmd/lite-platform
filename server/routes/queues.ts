/**
 * Queue Management Routes
 * =======================
 * API endpoints for monitoring and triggering async jobs.
 * RETAILER_LT only — vendors cannot manage queues.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole } from "../middleware/auth.js";
import {
  QUEUE_NAMES,
  getQueue,
  addOrderLifecycleJob,
  addShopifySyncJob,
  addLabelGenerationJob,
  addSettlementJob,
  addCatalogEnrichmentJob,
} from "../queues/index.js";

export async function queueRoutes(app: FastifyInstance) {
  // All queue routes require RETAILER_LT role
  app.addHook("preHandler", requireRole("RETAILER_LT"));

  // GET /api/queues/stats — Overview of all queues
  app.get("/stats", async () => {
    const stats = await Promise.all(
      Object.entries(QUEUE_NAMES).map(async ([key, name]) => {
        const queue = getQueue(name);
        const counts = await queue.getJobCounts();
        return { name, ...counts };
      })
    );
    return stats;
  });

  // GET /api/queues/:name/jobs — List jobs in a queue
  app.get("/:name/jobs", async (request: FastifyRequest) => {
    const { name } = request.params as { name: string };
    const { status = "active", page = "1", limit = "20" } = request.query as any;

    const queue = getQueue(name as any);
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit) - 1;

    let jobs;
    switch (status) {
      case "active":
        jobs = await queue.getActive(start, end);
        break;
      case "waiting":
        jobs = await queue.getWaiting(start, end);
        break;
      case "completed":
        jobs = await queue.getCompleted(start, end);
        break;
      case "failed":
        jobs = await queue.getFailed(start, end);
        break;
      case "delayed":
        jobs = await queue.getDelayed(start, end);
        break;
      default:
        jobs = await queue.getActive(start, end);
    }

    return jobs.map((j) => ({
      id: j.id,
      name: j.name,
      data: j.data,
      status: j.finishedOn ? "completed" : j.failedReason ? "failed" : "active",
      attempts: j.attemptsMade,
      createdAt: j.timestamp,
      processedAt: j.processedOn,
      finishedAt: j.finishedOn,
      failedReason: j.failedReason,
    }));
  });

  // POST /api/queues/trigger/shopify-sync
  app.post("/trigger/shopify-sync", async (request: FastifyRequest) => {
    const { vendorId, syncType = "full" } = request.body as any;
    const job = await addShopifySyncJob({ vendorId, syncType });
    return { jobId: job.id, queue: QUEUE_NAMES.SHOPIFY_SYNC };
  });

  // POST /api/queues/trigger/order-transition
  app.post("/trigger/order-transition", async (request: FastifyRequest) => {
    const { vendorOrderId, targetStatus } = request.body as any;
    const user = request.authUser!;
    const job = await addOrderLifecycleJob({
      vendorOrderId,
      targetStatus,
      triggeredBy: user.id,
    });
    return { jobId: job.id, queue: QUEUE_NAMES.ORDER_LIFECYCLE };
  });

  // POST /api/queues/trigger/settlement
  app.post("/trigger/settlement", async (request: FastifyRequest) => {
    const { settlementId, vendorId, amount, currency } = request.body as any;
    const idempotencyKey = `settlement-${settlementId}-${Date.now()}`;
    const job = await addSettlementJob({
      settlementId,
      vendorId,
      amount,
      currency,
      idempotencyKey,
    });
    return { jobId: job.id, queue: QUEUE_NAMES.SETTLEMENT_PROCESSING };
  });

  // POST /api/queues/trigger/enrichment
  app.post("/trigger/enrichment", async (request: FastifyRequest) => {
    const { productId, vendorId, enrichmentType = "full" } = request.body as any;
    const job = await addCatalogEnrichmentJob({ productId, vendorId, enrichmentType });
    return { jobId: job.id, queue: QUEUE_NAMES.CATALOG_ENRICHMENT };
  });
}
