import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function analyticsRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/analytics/orders
  app.get("/orders", async (request) => {
    const { period = "30d" } = request.query as any;
    const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // MarketplaceOrder doesn't have RLS, but keep consistent
    const orders = await prisma.marketplaceOrder.findMany({
      where: { placedAt: { gte: startDate } },
      select: { placedAt: true, totalAmount: true, status: true },
    });

    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach((o: any) => {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.status !== "CANCELLED") {
        totalRevenue += o.totalAmount;
      }
      totalOrders++;
    });

    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalOrders, totalRevenue, aov, byStatus, period };
  });

  // GET /api/analytics/vendors
  app.get("/vendors", async (request) => {
    // VendorOrder, Return, Product all have RLS
    const vendorStats = await withRls(prisma, request, async (tx) => {
      const vendors = await tx.vendor.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, location: true, economicModel: true,
          _count: { select: { products: true, vendorOrders: true, returns: true } },
        },
      });

      const results = await Promise.all(
        vendors.map(async (v: any) => {
          const [revenue, returns] = await Promise.all([
            tx.vendorOrder.aggregate({
              _sum: { subtotal: true, commission: true },
              where: { vendorId: v.id },
            }),
            tx.return.count({ where: { vendorId: v.id } }),
          ]);

          const returnRate = v._count.vendorOrders > 0
            ? (returns / v._count.vendorOrders) * 100
            : 0;

          return {
            ...v,
            revenue: revenue._sum.subtotal || 0,
            commission: revenue._sum.commission || 0,
            returnRate: Math.round(returnRate * 10) / 10,
          };
        })
      );

      return results;
    });

    return vendorStats;
  });

  // GET /api/analytics/shipping
  app.get("/shipping", async (request) => {
    // Shipment has RLS
    const result = await withRls(prisma, request, async (tx) => {
      const byCarrier = await tx.shipment.groupBy({
        by: ["carrier"],
        _count: true,
        _sum: { shippingCost: true },
      });

      const byStatus = await tx.shipment.groupBy({
        by: ["status"],
        _count: true,
      });

      const avgDeliveryTime = await tx.shipment.aggregate({
        _avg: { shippingCost: true },
      });

      return { byCarrier, byStatus, avgShippingCost: avgDeliveryTime._avg.shippingCost || 0 };
    });

    return result;
  });

  // GET /api/analytics/catalog
  app.get("/catalog", async (request) => {
    // Product has RLS
    const result = await withRls(prisma, request, async (tx) => {
      const byStatus = await tx.product.groupBy({
        by: ["status"],
        _count: true,
        where: { isDeleted: false },
      });

      const byCategory = await tx.product.groupBy({
        by: ["category"],
        _count: true,
        where: { isDeleted: false, category: { not: null } },
        orderBy: { _count: { category: "desc" } },
        take: 15,
      });

      const enrichmentDist = await tx.product.groupBy({
        by: ["enrichmentScore"],
        _count: true,
        where: { isDeleted: false },
      });

      return { byStatus, byCategory, enrichmentDist };
    });

    return result;
  });
}
