import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function shipmentRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/shipments
  app.get("/", async (request) => {
    const {
      vendorId, status, carrier, leg, page = "1", limit = "20",
    } = request.query as any;

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (carrier) where.carrier = carrier;
    if (leg) where.leg = leg;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Shipment has RLS, and includes vendorOrder (SubOrder) + product — both RLS-protected
    const { shipments, total } = await withRls(prisma, request, async (tx) => {
      const [shipments, total] = await Promise.all([
        tx.shipment.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            vendor: { select: { id: true, name: true } },
            vendorOrder: {
              include: {
                order: { select: { id: true, orderNumber: true, customerName: true } },
                items: { include: { product: { select: { id: true, title: true } } } },
              },
            },
            trackingEvents: { orderBy: { timestamp: "desc" }, take: 5 },
            childShipments: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        tx.shipment.count({ where }),
      ]);
      return { shipments, total };
    });

    return { shipments, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/shipments/stats
  app.get("/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [total, labelCreated, inTransit, delivered, exceptions] = await Promise.all([
        tx.shipment.count(),
        tx.shipment.count({ where: { status: "LABEL_CREATED" } }),
        tx.shipment.count({ where: { status: "IN_TRANSIT" } }),
        tx.shipment.count({ where: { status: "DELIVERED" } }),
        tx.shipment.count({ where: { status: "EXCEPTION" } }),
      ]);

      const costs = await tx.shipment.aggregate({
        _sum: { shippingCost: true },
      });

      return { total, labelCreated, inTransit, delivered, exceptions, totalCost: costs._sum.shippingCost || 0 };
    });

    return result;
  });

  // GET /api/shipments/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    const shipment = await withRls(prisma, request, async (tx) => {
      return tx.shipment.findUnique({
        where: { id },
        include: {
          vendor: true,
          vendorOrder: {
            include: {
              order: true,
              items: { include: { product: { include: { images: { take: 1 } } }, variant: true } },
            },
          },
          trackingEvents: { orderBy: { timestamp: "desc" } },
          childShipments: { include: { trackingEvents: { orderBy: { timestamp: "desc" } } } },
          parentShipment: true,
        },
      });
    });

    if (!shipment) return { error: "Shipment not found" };
    return shipment;
  });

  // POST /api/shipments
  app.post("/", async (request) => {
    const data = request.body as any;

    const shipment = await withRls(prisma, request, async (tx) => {
      return tx.shipment.create({ data });
    });
    return shipment;
  });

  // PUT /api/shipments/:id/void
  app.put("/:id/void", async (request) => {
    const { id } = request.params as { id: string };

    const shipment = await withRls(prisma, request, async (tx) => {
      const updated = await tx.shipment.update({
        where: { id },
        data: { status: "LABEL_VOIDED", labelVoidedAt: new Date() },
      });
      await tx.labelGenerationLog.create({
        data: {
          shipmentId: id,
          vendorOrderId: updated.vendorOrderId,
          trackingNumber: updated.trackingNumber,
          action: "voided",
          carrier: updated.carrier,
        },
      });
      return updated;
    });

    return shipment;
  });
}
