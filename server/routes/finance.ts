import { FastifyInstance } from "fastify";

export async function financeRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/finance/payouts
  app.get("/payouts", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          vendor: { select: { id: true, name: true, currency: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payout.count({ where }),
    ]);

    return { payouts, total };
  });

  // GET /api/finance/payouts/stats
  app.get("/payouts/stats", async () => {
    const [totalPending, totalProcessing, totalCompleted] = await Promise.all([
      prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
      prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "PROCESSING" } }),
      prisma.payout.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    ]);

    return {
      pending: totalPending._sum.amount || 0,
      processing: totalProcessing._sum.amount || 0,
      completed: totalCompleted._sum.amount || 0,
    };
  });

  // GET /api/finance/settlements
  app.get("/settlements", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          vendor: { select: { id: true, name: true, currency: true } },
          vendorOrder: { select: { id: true, orderId: true, subtotal: true } },
          events: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.settlement.count({ where }),
    ]);

    return { settlements, total };
  });

  // GET /api/finance/settlements/stats
  app.get("/settlements/stats", async () => {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.settlement.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
      prisma.settlement.aggregate({ _sum: { amount: true }, where: { status: "PROCESSING" } }),
      prisma.settlement.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
      prisma.settlement.aggregate({ _sum: { amount: true }, where: { status: "FAILED" } }),
    ]);

    return {
      pending: pending._sum.amount || 0,
      processing: processing._sum.amount || 0,
      completed: completed._sum.amount || 0,
      failed: failed._sum.amount || 0,
    };
  });

  // GET /api/finance/deductions
  app.get("/deductions", async (request) => {
    const { vendorId, type, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (type) where.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [deductions, total] = await Promise.all([
      prisma.deduction.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.deduction.count({ where }),
    ]);

    return { deductions, total };
  });

  // GET /api/finance/pnl - Profit & Loss summary
  app.get("/pnl", async (request) => {
    const revenue = await prisma.marketplaceOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { notIn: ["CANCELLED"] } },
    });

    const commissions = await prisma.vendorOrder.aggregate({
      _sum: { commission: true },
    });

    const shippingCosts = await prisma.shipment.aggregate({
      _sum: { shippingCost: true },
    });

    const refunds = await prisma.return.aggregate({
      _sum: { refundAmount: true },
      where: { status: "REFUNDED" },
    });

    const deductions = await prisma.deduction.aggregate({
      _sum: { amount: true },
      where: { isApplied: true },
    });

    const totalRevenue = revenue._sum.totalAmount || 0;
    const totalCommissions = commissions._sum.commission || 0;
    const totalShipping = shippingCosts._sum.shippingCost || 0;
    const totalRefunds = refunds._sum.refundAmount || 0;
    const totalDeductions = deductions._sum.amount || 0;
    const cogs = totalRevenue - totalCommissions;
    const grossProfit = totalCommissions;
    const operatingExpenses = totalShipping + totalRefunds;
    const netProfit = grossProfit - operatingExpenses;

    return {
      revenue: totalRevenue,
      cogs,
      grossProfit,
      commissions: totalCommissions,
      shippingCosts: totalShipping,
      refunds: totalRefunds,
      deductions: totalDeductions,
      operatingExpenses,
      netProfit,
    };
  });

  // GET /api/finance/vendor-balances
  app.get("/vendor-balances", async () => {
    const vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        currency: true,
        payoutCycle: true,
        _count: { select: { payouts: true, deductions: true, settlements: true } },
      },
    });

    const balances = await Promise.all(
      vendors.map(async (v: any) => {
        const [earned, paid, deducted, settled] = await Promise.all([
          prisma.vendorOrder.aggregate({
            _sum: { vendorEarnings: true },
            where: { vendorId: v.id, status: { in: ["DELIVERED", "SETTLED"] } },
          }),
          prisma.payout.aggregate({
            _sum: { amount: true },
            where: { vendorId: v.id, status: "COMPLETED" },
          }),
          prisma.deduction.aggregate({
            _sum: { amount: true },
            where: { vendorId: v.id, isApplied: true },
          }),
          prisma.settlement.aggregate({
            _sum: { amount: true },
            where: { vendorId: v.id, status: "COMPLETED" },
          }),
        ]);

        return {
          ...v,
          totalEarned: earned._sum.vendorEarnings || 0,
          totalPaid: paid._sum.amount || 0,
          totalDeducted: deducted._sum.amount || 0,
          totalSettled: settled._sum.amount || 0,
          balance:
            (earned._sum.vendorEarnings || 0) -
            (paid._sum.amount || 0) -
            (deducted._sum.amount || 0),
        };
      })
    );

    return balances;
  });
}
