import { FastifyInstance } from "fastify";

export async function orderRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/orders - all orders with filters
  app.get("/", async (request) => {
    const {
      search, status, vendorId, dateFrom, dateTo,
      page = "1", limit = "20", sortBy = "placedAt", sortOrder = "desc",
    } = request.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.placedAt = {};
      if (dateFrom) where.placedAt.gte = new Date(dateFrom);
      if (dateTo) where.placedAt.lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          subOrders: {
            include: {
              vendor: { select: { id: true, name: true, slug: true } },
              items: {
                include: {
                  product: { select: { id: true, title: true, images: { take: 1 } } },
                },
              },
              _count: { select: { shipments: true, returns: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/orders/stats
  app.get("/stats", async () => {
    const [total, placed, fraudHold, pendingAccept, shipped, inTransit, delivered, cancelled] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PLACED" } }),
        prisma.order.count({ where: { status: "FRAUD_HOLD" } }),
        prisma.order.count({ where: { status: "VENDOR_ACCEPT" } }),
        prisma.order.count({ where: { status: "SHIPPED" } }),
        prisma.order.count({ where: { status: "IN_TRANSIT" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.order.count({ where: { status: "CANCELLED" } }),
      ]);

    const revenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ["CANCELLED"] } },
    });

    return {
      total, placed, fraudHold, pendingAccept, shipped, inTransit, delivered, cancelled,
      totalRevenue: revenue._sum.totalAmount || 0,
    };
  });

  // GET /api/orders/pending-acceptance
  app.get("/pending-acceptance", async (request) => {
    const { vendorId, page = "1", limit = "20" } = request.query as any;
    const where: any = { status: "PLACED" };
    if (vendorId) where.vendorId = vendorId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subOrders, total] = await Promise.all([
      prisma.subOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          order: true,
          vendor: { select: { id: true, name: true } },
          items: { include: { product: { include: { images: { take: 1 } } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subOrder.count({ where }),
    ]);

    return { orders: subOrders, total };
  });

  // GET /api/orders/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        subOrders: {
          include: {
            vendor: true,
            items: {
              include: {
                product: { include: { images: { take: 1 } } },
                variant: true,
              },
            },
            shipments: { include: { trackingEvents: { orderBy: { timestamp: "desc" } } } },
            returns: true,
          },
        },
        priceSnapshot: true,
      },
    });
    if (!order) return { error: "Order not found" };
    return order;
  });

  // POST /api/orders/:subOrderId/accept
  app.post("/:subOrderId/accept", async (request) => {
    const { subOrderId } = request.params as { subOrderId: string };
    const subOrder = await prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: "VENDOR_ACCEPT", acceptedAt: new Date() },
    });
    return subOrder;
  });

  // POST /api/orders/:subOrderId/reject
  app.post("/:subOrderId/reject", async (request) => {
    const { subOrderId } = request.params as { subOrderId: string };
    const { reason } = request.body as { reason: string };
    const subOrder = await prisma.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: "VENDOR_REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
    return subOrder;
  });
}
