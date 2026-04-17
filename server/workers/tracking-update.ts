/**
 * Tracking Update Worker
 * ======================
 * Polls carrier APIs for tracking updates.
 * Updates shipment status and creates tracking events.
 * Triggers order lifecycle transitions when delivery is confirmed.
 */

import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import {
  QUEUE_NAMES,
  redisConnection,
  addOrderLifecycleJob,
  type TrackingUpdateJob,
} from "../queues/index.js";

const prisma = new PrismaClient();

// ============================================================
// Carrier Tracking API Stubs
// ============================================================

interface TrackingEvent {
  status: string;
  description: string;
  location: string;
  timestamp: Date;
}

async function pollFedExTracking(trackingNumber: string): Promise<TrackingEvent[]> {
  // TODO: Replace with actual FedEx Track API v1
  return [];
}

async function pollDHLTracking(trackingNumber: string): Promise<TrackingEvent[]> {
  // TODO: Replace with actual DHL Tracking API
  return [];
}

async function pollUPSTracking(trackingNumber: string): Promise<TrackingEvent[]> {
  // TODO: Replace with actual UPS Tracking API
  return [];
}

const TRACKING_HANDLERS: Record<string, (tn: string) => Promise<TrackingEvent[]>> = {
  FEDEX: pollFedExTracking,
  DHL: pollDHLTracking,
  UPS: pollUPSTracking,
};

// ============================================================
// Status Mapping
// ============================================================

function mapTrackingStatusToShipmentStatus(
  trackingStatus: string
): any {
  const mapping: Record<string, string> = {
    picked_up: "PICKED_UP",
    in_transit: "IN_TRANSIT",
    out_for_delivery: "OUT_FOR_DELIVERY",
    delivered: "DELIVERED",
    exception: "EXCEPTION",
    returned: "RETURNED",
  };
  return mapping[trackingStatus.toLowerCase()] || null;
}

// ============================================================
// Worker Processor
// ============================================================

async function processTrackingUpdate(job: Job<TrackingUpdateJob>) {
  const { shipmentId, trackingNumber, carrier } = job.data;

  job.log(`Polling ${carrier} tracking for ${trackingNumber}`);

  const handler = TRACKING_HANDLERS[carrier];
  if (!handler) {
    throw new Error(`Unsupported carrier: ${carrier}`);
  }

  const events = await handler(trackingNumber);

  if (events.length === 0) {
    job.log("No new tracking events");
    return { success: true, newEvents: 0 };
  }

  // Get existing events to avoid duplicates
  const existingEvents = await prisma.trackingEvent.findMany({
    where: { shipmentId },
    select: { timestamp: true, status: true },
  });

  const existingSet = new Set(
    existingEvents.map((e) => `${e.timestamp.toISOString()}-${e.status}`)
  );

  const newEvents = events.filter(
    (e) => !existingSet.has(`${e.timestamp.toISOString()}-${e.status}`)
  );

  if (newEvents.length === 0) {
    job.log("All events already recorded");
    return { success: true, newEvents: 0 };
  }

  // Insert new events and update shipment status
  const latestEvent = newEvents[newEvents.length - 1];
  const newShipmentStatus = mapTrackingStatusToShipmentStatus(latestEvent.status);

  await prisma.$transaction(async (tx) => {
    // Insert tracking events
    await tx.trackingEvent.createMany({
      data: newEvents.map((e) => ({
        shipmentId,
        status: e.status,
        description: e.description,
        location: e.location,
        timestamp: e.timestamp,
      })),
    });

    // Update shipment status if changed
    if (newShipmentStatus) {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        select: { status: true, vendorOrderId: true },
      });

      if (shipment && shipment.status !== newShipmentStatus) {
        await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: newShipmentStatus,
            ...(newShipmentStatus === "DELIVERED"
              ? { actualDelivery: latestEvent.timestamp }
              : {}),
          },
        });

        // Trigger order lifecycle transition if delivered
        if (newShipmentStatus === "DELIVERED" && shipment.vendorOrderId) {
          await addOrderLifecycleJob({
            vendorOrderId: shipment.vendorOrderId,
            targetStatus: "DELIVERED",
            triggeredBy: "system",
            metadata: { trackingNumber, carrier },
          });
        }
      }
    }
  });

  job.log(`✅ ${newEvents.length} new tracking events recorded`);
  return { success: true, newEvents: newEvents.length };
}

// ============================================================
// Worker Instance
// ============================================================

export function createTrackingUpdateWorker() {
  const worker = new Worker(
    QUEUE_NAMES.TRACKING_UPDATE,
    processTrackingUpdate,
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[tracking] ✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[tracking] ❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
