import { FastifyInstance } from "fastify";

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
    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
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
      prisma.shipment.count({ where }),
    ]);

    return { shipments, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/shipments/stats
  app.get("/stats", async () => {
    const [total, labelCreated, inTransit, delivered, exceptions] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: "LABEL_CREATED" } }),
      prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
      prisma.shipment.count({ where: { status: "DELIVERED" } }),
      prisma.shipment.count({ where: { status: "EXCEPTION" } }),
    ]);

    const costs = await prisma.shipment.aggregate({
      _sum: { shippingCost: true },
    });

    return { total, labelCreated, inTransit, delivered, exceptions, totalCost: costs._sum.shippingCost || 0 };
  });

  // GET /api/shipments/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const shipment = await prisma.shipment.findUnique({
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
    if (!shipment) return { error: "Shipment not found" };
    return shipment;
  });

  // POST /api/shipments
  app.post("/", async (request) => {
    const data = request.body as any;
    const shipment = await prisma.shipment.create({ data });
    return shipment;
  });

  // PUT /api/shipments/:id/void
  app.put("/:id/void", async (request) => {
    const { id } = request.params as { id: string };
    const shipment = await prisma.shipment.update({
      where: { id },
      data: { status: "LABEL_VOIDED", labelVoidedAt: new Date() },
    });
    // Log the void using typed LabelGenerationLog
    await prisma.labelGenerationLog.create({
      data: {
        shipmentId: id,
        vendorOrderId: shipment.vendorOrderId,
        trackingNumber: shipment.trackingNumber,
        action: "voided",
        carrier: shipment.carrier,
      },
    });
    return shipment;
  });
}
