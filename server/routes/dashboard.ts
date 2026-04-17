import { FastifyInstance } from "fastify";

export async function dashboardRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/dashboard/kpis
  app.get("/kpis", async () => {
    const [
      totalOrders, totalProducts, totalVendors, activeVendors,
      totalRevenue, totalShipments, totalReturns, pendingReview,
    ] = await Promise.all([
      prisma.marketplaceOrder.count(),
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.marketplaceOrder.aggregate({ _sum: { totalAmount: true }, where: { status: { notIn: ["CANCELLED"] } } }),
      prisma.shipment.count(),
      prisma.return.count(),
      prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
    ]);

    // Commission earned
    const commissions = await prisma.vendorOrder.aggregate({ _sum: { commission: true } });

    // Orders needing action
    const fraudHold = await prisma.marketplaceOrder.count({ where: { status: "FRAUD_HOLD" } });
    const pendingAcceptance = await prisma.vendorOrder.count({ where: { status: "PLACED" } });
    const pendingShipment = await prisma.vendorOrder.count({ where: { status: "VENDOR_ACCEPT" } });
    const inTransit = await prisma.shipment.count({ where: { status: "IN_TRANSIT" } });
    const exceptions = await prisma.shipment.count({ where: { status: "EXCEPTION" } });
    const openMessages = await prisma.messageThread.count({ where: { status: "OPEN" } });
    const pendingPayouts = await prisma.payout.count({ where: { status: "PENDING" } });

    return {
      totalOrders,
      totalProducts,
      totalVendors,
      activeVendors,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCommissions: commissions._sum.commission || 0,
      totalShipments,
      totalReturns,
      pendingReview,
      actionRequired: {
        fraudHold,
        pendingAcceptance,
        pendingShipment,
        inTransit,
        exceptions,
        openMessages,
        pendingPayouts,
      },
    };
  });

  // GET /api/dashboard/recent-orders
  app.get("/recent-orders", async () => {
    const orders = await prisma.marketplaceOrder.findMany({
      take: 10,
      orderBy: { placedAt: "desc" },
      include: {
        vendorOrders: {
          include: {
            vendor: { select: { id: true, name: true } },
            items: {
              include: {
                product: { select: { id: true, title: true, images: { take: 1 } } },
              },
            },
          },
        },
      },
    });
    return orders;
  });

  // GET /api/dashboard/top-vendors
  app.get("/top-vendors", async () => {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        location: true,
        country: true,
        economicModel: true,
        logoUrl: true,
        _count: { select: { products: true, vendorOrders: true } },
      },
      take: 10,
    });

    const vendorsWithRevenue = await Promise.all(
      vendors.map(async (v: any) => {
        const revenue = await prisma.vendorOrder.aggregate({
          _sum: { subtotal: true },
          where: { vendorId: v.id },
        });
        return { ...v, totalRevenue: revenue._sum.subtotal || 0 };
      })
    );

    return vendorsWithRevenue.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
  });

  // GET /api/dashboard/revenue-chart
  app.get("/revenue-chart", async () => {
    // Return last 30 days of daily revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.marketplaceOrder.findMany({
      where: {
        placedAt: { gte: thirtyDaysAgo },
        status: { notIn: ["CANCELLED"] },
      },
      select: { placedAt: true, totalAmount: true },
      orderBy: { placedAt: "asc" },
    });

    // Group by day
    const dailyRevenue: Record<string, number> = {};
    orders.forEach((o: any) => {
      const day = o.placedAt.toISOString().split("T")[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + o.totalAmount;
    });

    return Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount }));
  });
}
