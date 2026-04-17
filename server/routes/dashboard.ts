import { FastifyInstance } from "fastify";

export async function dashboardRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  /**
   * Helper: run all queries inside a single interactive transaction so they share
   * the same Prisma pool connection (and therefore the same RLS session variables
   * set by the preHandler hook).
   */

  // GET /api/dashboard/kpis
  app.get("/kpis", async (request) => {
    const { range } = request.query as { range?: string };

    // Build date filter for time-scoped metrics
    const now = new Date();
    let dateFrom: Date | undefined;
    if (range === "today") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "week") {
      dateFrom = new Date(now);
      dateFrom.setDate(dateFrom.getDate() - 7);
    } else if (range === "month") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const dateFilter = dateFrom ? { placedAt: { gte: dateFrom } } : {};

    // Use interactive transaction to ensure RLS context is on the same connection
    return prisma.$transaction(async (tx: any) => {
      // Re-set RLS context inside the transaction to guarantee it's on this connection
      const user = (request as any).authUser;
      if (user) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_role', $1, true)`,
          user.role
        );
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_vendor_id', $1, true)`,
          user.vendorId || "__NONE__"
        );
      }

      const [
        totalOrders, totalProducts, totalVendors, activeVendors,
        totalRevenue, totalShipments, totalReturns, pendingReview,
      ] = await Promise.all([
        tx.marketplaceOrder.count({ where: dateFilter }),
        tx.product.count({ where: { isDeleted: false } }),
        tx.vendor.count(),
        tx.vendor.count({ where: { isActive: true } }),
        tx.marketplaceOrder.aggregate({
          _sum: { totalAmount: true },
          where: { status: { notIn: ["CANCELLED"] }, ...dateFilter },
        }),
        tx.shipment.count(),
        tx.return.count(),
        tx.product.count({ where: { status: "PENDING_REVIEW" } }),
      ]);

      // Commission earned
      const commissions = await tx.vendorOrder.aggregate({ _sum: { commission: true } });

      // Orders needing action
      const [
        fraudHold, pendingAcceptance, pendingShipment,
        inTransit, exceptions, openMessages, pendingPayouts,
        stockOuts, complianceIssues,
      ] = await Promise.all([
        tx.marketplaceOrder.count({ where: { status: "FRAUD_HOLD" } }),
        tx.vendorOrder.count({ where: { status: "PLACED" } }),
        tx.vendorOrder.count({ where: { status: "VENDOR_ACCEPT" } }),
        tx.shipment.count({ where: { status: "IN_TRANSIT" } }),
        tx.shipment.count({ where: { status: "EXCEPTION" } }),
        tx.messageThread.count({ where: { status: "OPEN" } }),
        tx.payout.count({ where: { status: "PENDING" } }),
        tx.product.count({
          where: {
            isDeleted: false,
            variants: { some: { inventoryQuantity: { lte: 0 } } },
          },
        }),
        tx.product.count({ where: { complianceRisk: "HIGH", isDeleted: false } }),
      ]);

      // Order status breakdown
      const orderStatuses = await tx.marketplaceOrder.groupBy({
        by: ["status"],
        _count: true,
        where: dateFilter,
      });
      const statusBreakdown: Record<string, number> = {};
      orderStatuses.forEach((s: any) => {
        statusBreakdown[s.status] = s._count;
      });

      // Date-scoped sub-metrics (today, week, month)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayGmv, weekGmv, monthGmv] = await Promise.all([
        tx.marketplaceOrder.aggregate({
          _sum: { totalAmount: true },
          _count: true,
          where: { placedAt: { gte: todayStart }, status: { notIn: ["CANCELLED"] } },
        }),
        tx.marketplaceOrder.aggregate({
          _sum: { totalAmount: true },
          _count: true,
          where: { placedAt: { gte: weekStart }, status: { notIn: ["CANCELLED"] } },
        }),
        tx.marketplaceOrder.aggregate({
          _sum: { totalAmount: true },
          _count: true,
          where: { placedAt: { gte: monthStart }, status: { notIn: ["CANCELLED"] } },
        }),
      ]);

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
          stockOuts,
          complianceIssues,
        },
        statusBreakdown,
        periodMetrics: {
          today: { gmv: todayGmv._sum.totalAmount || 0, orders: todayGmv._count || 0 },
          week: { gmv: weekGmv._sum.totalAmount || 0, orders: weekGmv._count || 0 },
          month: { gmv: monthGmv._sum.totalAmount || 0, orders: monthGmv._count || 0 },
        },
      };
    });
  });

  // GET /api/dashboard/recent-orders
  app.get("/recent-orders", async (request) => {
    return prisma.$transaction(async (tx: any) => {
      const user = (request as any).authUser;
      if (user) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_role', $1, true)`,
          user.role
        );
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_vendor_id', $1, true)`,
          user.vendorId || "__NONE__"
        );
      }

      const orders = await tx.marketplaceOrder.findMany({
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
  });

  // GET /api/dashboard/top-vendors
  app.get("/top-vendors", async (request) => {
    return prisma.$transaction(async (tx: any) => {
      const user = (request as any).authUser;
      if (user) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_role', $1, true)`,
          user.role
        );
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_vendor_id', $1, true)`,
          user.vendorId || "__NONE__"
        );
      }

      const vendors = await tx.vendor.findMany({
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
        take: 12,
      });

      const vendorsWithRevenue = await Promise.all(
        vendors.map(async (v: any) => {
          const revenue = await tx.vendorOrder.aggregate({
            _sum: { subtotal: true },
            where: { vendorId: v.id },
          });
          return { ...v, totalRevenue: revenue._sum.subtotal || 0 };
        })
      );

      return vendorsWithRevenue.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
    });
  });

  // GET /api/dashboard/revenue-chart
  app.get("/revenue-chart", async (request) => {
    return prisma.$transaction(async (tx: any) => {
      const user = (request as any).authUser;
      if (user) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_role', $1, true)`,
          user.role
        );
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_vendor_id', $1, true)`,
          user.vendorId || "__NONE__"
        );
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const orders = await tx.marketplaceOrder.findMany({
        where: {
          placedAt: { gte: thirtyDaysAgo },
          status: { notIn: ["CANCELLED"] },
        },
        select: { placedAt: true, totalAmount: true },
        orderBy: { placedAt: "asc" },
      });

      const dailyRevenue: Record<string, number> = {};
      orders.forEach((o: any) => {
        const day = o.placedAt.toISOString().split("T")[0];
        dailyRevenue[day] = (dailyRevenue[day] || 0) + o.totalAmount;
      });

      return Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount }));
    });
  });

  // GET /api/dashboard/order-status-breakdown
  app.get("/order-status-breakdown", async (request) => {
    return prisma.$transaction(async (tx: any) => {
      const user = (request as any).authUser;
      if (user) {
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_user_role', $1, true)`,
          user.role
        );
        await tx.$executeRawUnsafe(
          `SELECT set_config('app.current_vendor_id', $1, true)`,
          user.vendorId || "__NONE__"
        );
      }

      const statuses = await tx.marketplaceOrder.groupBy({
        by: ["status"],
        _count: true,
      });

      return statuses.reduce((acc: Record<string, number>, s: any) => {
        acc[s.status] = s._count;
        return acc;
      }, {});
    });
  });
}
