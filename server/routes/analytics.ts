import { FastifyInstance } from "fastify";

export async function analyticsRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/analytics/orders
  app.get("/orders", async (request) => {
    const { period = "30d" } = request.query as any;
    const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

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
  app.get("/vendors", async () => {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, location: true, economicModel: true,
        _count: { select: { products: true, vendorOrders: true, returns: true } },
      },
    });

    const vendorStats = await Promise.all(
      vendors.map(async (v: any) => {
        const [revenue, returns] = await Promise.all([
          prisma.vendorOrder.aggregate({
            _sum: { subtotal: true, commission: true },
            where: { vendorId: v.id },
          }),
          prisma.return.count({ where: { vendorId: v.id } }),
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

    return vendorStats;
  });

  // GET /api/analytics/shipping
  app.get("/shipping", async () => {
    const byCarrier = await prisma.shipment.groupBy({
      by: ["carrier"],
      _count: true,
      _sum: { shippingCost: true },
    });

    const byStatus = await prisma.shipment.groupBy({
      by: ["status"],
      _count: true,
    });

    const avgDeliveryTime = await prisma.shipment.aggregate({
      _avg: { shippingCost: true },
    });

    return { byCarrier, byStatus, avgShippingCost: avgDeliveryTime._avg.shippingCost || 0 };
  });

  // GET /api/analytics/catalog
  app.get("/catalog", async () => {
    const byStatus = await prisma.product.groupBy({
      by: ["status"],
      _count: true,
      where: { isDeleted: false },
    });

    const byCategory = await prisma.product.groupBy({
      by: ["category"],
      _count: true,
      where: { isDeleted: false, category: { not: null } },
      orderBy: { _count: { category: "desc" } },
      take: 15,
    });

    const enrichmentDist = await prisma.product.groupBy({
      by: ["enrichmentScore"],
      _count: true,
      where: { isDeleted: false },
    });

    return { byStatus, byCategory, enrichmentDist };
  });
}
