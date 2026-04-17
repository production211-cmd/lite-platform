import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function financeRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/finance/payouts
  app.get("/payouts", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Payout has RLS
    const { payouts, total } = await withRls(prisma, request, async (tx) => {
      const [payouts, total] = await Promise.all([
        tx.payout.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            vendor: { select: { id: true, name: true, currency: true } },
            items: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        tx.payout.count({ where }),
      ]);
      return { payouts, total };
    });

    return { payouts, total };
  });

  // GET /api/finance/payouts/stats
  app.get("/payouts/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [totalPending, totalProcessing, totalCompleted] = await Promise.all([
        tx.payout.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
        tx.payout.aggregate({ _sum: { amount: true }, where: { status: "PROCESSING" } }),
        tx.payout.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
      ]);

      return {
        pending: totalPending._sum.amount || 0,
        processing: totalProcessing._sum.amount || 0,
        completed: totalCompleted._sum.amount || 0,
      };
    });

    return result;
  });

  // GET /api/finance/settlements
  app.get("/settlements", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Settlement has RLS
    const { settlements, total } = await withRls(prisma, request, async (tx) => {
      const [settlements, total] = await Promise.all([
        tx.settlement.findMany({
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
        tx.settlement.count({ where }),
      ]);
      return { settlements, total };
    });

    return { settlements, total };
  });

  // GET /api/finance/settlements/stats
  app.get("/settlements/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [pending, processing, completed, failed] = await Promise.all([
        tx.settlement.aggregate({ _sum: { amount: true }, where: { status: "PENDING" } }),
        tx.settlement.aggregate({ _sum: { amount: true }, where: { status: "PROCESSING" } }),
        tx.settlement.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
        tx.settlement.aggregate({ _sum: { amount: true }, where: { status: "FAILED" } }),
      ]);

      return {
        pending: pending._sum.amount || 0,
        processing: processing._sum.amount || 0,
        completed: completed._sum.amount || 0,
        failed: failed._sum.amount || 0,
      };
    });

    return result;
  });

  // GET /api/finance/deductions
  app.get("/deductions", async (request) => {
    const { vendorId, type, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (type) where.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Deduction has RLS
    const { deductions, total } = await withRls(prisma, request, async (tx) => {
      const [deductions, total] = await Promise.all([
        tx.deduction.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: { vendor: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        }),
        tx.deduction.count({ where }),
      ]);
      return { deductions, total };
    });

    return { deductions, total };
  });

  // GET /api/finance/pnl - Profit & Loss summary
  app.get("/pnl", async (request) => {
    // Multiple RLS-protected tables: vendorOrder, shipment, return, deduction
    const result = await withRls(prisma, request, async (tx) => {
      const revenue = await tx.marketplaceOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: { notIn: ["CANCELLED"] } },
      });

      const commissions = await tx.vendorOrder.aggregate({
        _sum: { commission: true },
      });

      const shippingCosts = await tx.shipment.aggregate({
        _sum: { shippingCost: true },
      });

      const refunds = await tx.return.aggregate({
        _sum: { refundAmount: true },
        where: { status: "REFUNDED" },
      });

      const deductions = await tx.deduction.aggregate({
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

    return result;
  });

  // GET /api/finance/vendor-balances
  app.get("/vendor-balances", async (request) => {
    // VendorOrder, Payout, Deduction, Settlement all have RLS
    const balances = await withRls(prisma, request, async (tx) => {
      const vendors = await tx.vendor.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          currency: true,
          payoutCycle: true,
          _count: { select: { payouts: true, deductions: true, settlements: true } },
        },
      });

      const results = await Promise.all(
        vendors.map(async (v: any) => {
          const [earned, paid, deducted, settled] = await Promise.all([
            tx.vendorOrder.aggregate({
              _sum: { vendorEarnings: true },
              where: { vendorId: v.id, status: { in: ["DELIVERED", "SETTLED"] } },
            }),
            tx.payout.aggregate({
              _sum: { amount: true },
              where: { vendorId: v.id, status: "COMPLETED" },
            }),
            tx.deduction.aggregate({
              _sum: { amount: true },
              where: { vendorId: v.id, isApplied: true },
            }),
            tx.settlement.aggregate({
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

      return results;
    });

    return balances;
  });
}
