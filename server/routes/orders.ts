import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function orderRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/orders - all marketplace orders with filters
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

    // vendorOrders, product, shipments, returns are all RLS-protected
    const { orders, total } = await withRls(prisma, request, async (tx) => {
      const [orders, total] = await Promise.all([
        tx.marketplaceOrder.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            vendorOrders: {
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
        tx.marketplaceOrder.count({ where }),
      ]);
      return { orders, total };
    });

    return { orders, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/orders/stats
  app.get("/stats", async (request) => {
    // MarketplaceOrder itself doesn't have RLS, but wrapping for consistency
    const [total, placed, fraudHold, pendingAccept, shipped, inTransit, delivered, cancelled] =
      await Promise.all([
        prisma.marketplaceOrder.count(),
        prisma.marketplaceOrder.count({ where: { status: "PLACED" } }),
        prisma.marketplaceOrder.count({ where: { status: "FRAUD_HOLD" } }),
        prisma.marketplaceOrder.count({ where: { status: "VENDOR_ACCEPT" } }),
        prisma.marketplaceOrder.count({ where: { status: "SHIPPED" } }),
        prisma.marketplaceOrder.count({ where: { status: "IN_TRANSIT" } }),
        prisma.marketplaceOrder.count({ where: { status: "DELIVERED" } }),
        prisma.marketplaceOrder.count({ where: { status: "CANCELLED" } }),
      ]);

    const revenue = await prisma.marketplaceOrder.aggregate({
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

    // VendorOrder (SubOrder) has RLS
    const { vendorOrders, total } = await withRls(prisma, request, async (tx) => {
      const [vendorOrders, total] = await Promise.all([
        tx.vendorOrder.findMany({
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
        tx.vendorOrder.count({ where }),
      ]);
      return { vendorOrders, total };
    });

    return { orders: vendorOrders, total };
  });

  // GET /api/orders/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    // Includes vendorOrders, product, shipments, returns, settlements — all RLS-protected
    const order = await withRls(prisma, request, async (tx) => {
      return tx.marketplaceOrder.findUnique({
        where: { id },
        include: {
          vendorOrders: {
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
              settlements: true,
            },
          },
          priceSnapshot: true,
        },
      });
    });

    if (!order) return { error: "Order not found" };
    return order;
  });

  // POST /api/orders/:vendorOrderId/accept
  app.post("/:vendorOrderId/accept", async (request) => {
    const { vendorOrderId } = request.params as { vendorOrderId: string };

    const vendorOrder = await withRls(prisma, request, async (tx) => {
      return tx.vendorOrder.update({
        where: { id: vendorOrderId },
        data: { status: "VENDOR_ACCEPT", acceptedAt: new Date() },
      });
    });
    return vendorOrder;
  });

  // POST /api/orders/:vendorOrderId/reject
  app.post("/:vendorOrderId/reject", async (request) => {
    const { vendorOrderId } = request.params as { vendorOrderId: string };
    const { reason } = request.body as { reason: string };

    const vendorOrder = await withRls(prisma, request, async (tx) => {
      return tx.vendorOrder.update({
        where: { id: vendorOrderId },
        data: {
          status: "VENDOR_REJECTED",
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });
    });
    return vendorOrder;
  });
}
