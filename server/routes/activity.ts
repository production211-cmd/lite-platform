import { FastifyInstance } from "fastify";

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  actor: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
}

export async function activityRoutes(app: FastifyInstance) {
  // GET /api/activity
  app.get("/", async (request) => {
    const { limit = "50", page = "1" } = request.query as any;
    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;
    const role = (request as any).authUser?.role || "RETAILER_LT";

    // Synthesize activity from real database events using $transaction for RLS
    const prisma = (app as any).prisma;
    const activities: ActivityEntry[] = await prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw`SELECT set_config('app.current_user_role', ${role}, true)`;

      const [recentOrders, recentShipments, recentPayouts, recentReturns, recentProducts] =
        await Promise.all([
          tx.marketplaceOrder.findMany({
            take: 15,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
          tx.shipment.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              vendor: { select: { name: true } },
            },
          }),
          tx.payout.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              vendor: { select: { name: true } },
            },
          }),
          tx.return.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
              vendor: { select: { name: true } },
            },
          }),
          tx.product.findMany({
            take: 10,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          }),
        ]);

      const entries: ActivityEntry[] = [];

      // Order events
      for (const o of recentOrders) {
        const statusMap: Record<string, { title: string; severity: string }> = {
          PLACED: { title: "New order received", severity: "info" },
          VENDOR_ACCEPT: { title: "Order accepted by vendor", severity: "success" },
          SHIPPED: { title: "Order shipped", severity: "info" },
          IN_TRANSIT: { title: "Order in transit", severity: "info" },
          DELIVERED: { title: "Order delivered", severity: "success" },
          SETTLED: { title: "Order settled", severity: "success" },
          CANCELLED: { title: "Order cancelled", severity: "warning" },
        };
        const info = statusMap[o.status] || { title: `Order status: ${o.status}`, severity: "info" };
        entries.push({
          id: `order-${o.id}`,
          timestamp: o.updatedAt?.toISOString() || o.createdAt.toISOString(),
          type: "order",
          severity: info.severity,
          title: info.title,
          description: `Order ${o.orderNumber} — $${(o.totalAmount || 0).toLocaleString()}. Status: ${o.status}.`,
          actor: "System",
          entityType: "order",
          entityId: o.id,
          entityLabel: o.orderNumber,
        });
      }

      // Shipment events
      for (const s of recentShipments) {
        const statusMap: Record<string, { title: string; severity: string }> = {
          PENDING: { title: "Shipment created", severity: "info" },
          LABEL_CREATED: { title: "Shipping label generated", severity: "info" },
          IN_TRANSIT: { title: "Shipment in transit", severity: "info" },
          DELIVERED: { title: "Shipment delivered", severity: "success" },
          EXCEPTION: { title: "Shipment exception", severity: "error" },
        };
        const info = statusMap[s.status] || { title: `Shipment ${s.status}`, severity: "info" };
        entries.push({
          id: `shipment-${s.id}`,
          timestamp: s.updatedAt?.toISOString() || s.createdAt.toISOString(),
          type: "shipment",
          severity: info.severity,
          title: info.title,
          description: `${s.carrier || "Unknown carrier"} — Tracking: ${s.trackingNumber || "N/A"}. Vendor: ${s.vendor?.name || "Unknown"}.`,
          actor: "System",
          entityType: "shipment",
          entityId: s.id,
          entityLabel: s.trackingNumber || s.id.slice(-8),
        });
      }

      // Payout events
      for (const p of recentPayouts) {
        const statusMap: Record<string, { title: string; severity: string }> = {
          PENDING: { title: "Payout scheduled", severity: "info" },
          PROCESSING: { title: "Payout processing", severity: "info" },
          COMPLETED: { title: "Payout completed", severity: "success" },
          FAILED: { title: "Payout failed", severity: "error" },
        };
        const info = statusMap[p.status] || { title: `Payout ${p.status}`, severity: "info" };
        entries.push({
          id: `payout-${p.id}`,
          timestamp: p.updatedAt?.toISOString() || p.createdAt.toISOString(),
          type: "finance",
          severity: info.severity,
          title: info.title,
          description: `${p.vendor?.name || "Unknown"} — ${p.currency} ${(p.amount || 0).toLocaleString()}. Cycle: ${p.payoutCycle}.`,
          actor: "Settlement Worker",
          entityType: "finance",
          entityId: p.id,
          entityLabel: `Payout-${p.id.slice(-6)}`,
        });
      }

      // Return events
      for (const r of recentReturns) {
        const statusMap: Record<string, { title: string; severity: string }> = {
          INITIATED: { title: "Return initiated", severity: "warning" },
          INSPECTING: { title: "Return under inspection", severity: "info" },
          APPROVED: { title: "Return approved", severity: "success" },
          REJECTED: { title: "Return rejected", severity: "error" },
          REFUNDED: { title: "Return refunded", severity: "success" },
        };
        const info = statusMap[r.status] || { title: `Return ${r.status}`, severity: "info" };
        entries.push({
          id: `return-${r.id}`,
          timestamp: r.updatedAt?.toISOString() || r.createdAt.toISOString(),
          type: "order",
          severity: info.severity,
          title: info.title,
          description: `Vendor: ${r.vendor?.name || "Unknown"}. Reason: ${r.reason || "Not specified"}. Refund: $${(r.refundAmount || 0).toLocaleString()}.`,
          actor: "System",
          entityType: "order",
          entityId: r.id,
          entityLabel: `RET-${r.id.slice(-6).toUpperCase()}`,
        });
      }

      // Product events
      for (const p of recentProducts) {
        const statusMap: Record<string, { title: string; severity: string }> = {
          PENDING_REVIEW: { title: "Product pending review", severity: "info" },
          APPROVED: { title: "Product approved", severity: "success" },
          REJECTED: { title: "Product rejected", severity: "warning" },
          LIVE: { title: "Product is live", severity: "success" },
        };
        const info = statusMap[p.status] || { title: `Product ${p.status}`, severity: "info" };
        entries.push({
          id: `product-${p.id}`,
          timestamp: p.updatedAt?.toISOString() || p.createdAt.toISOString(),
          type: "product",
          severity: info.severity,
          title: info.title,
          description: `${p.title || "Untitled product"}. Status: ${p.status}.`,
          actor: "System",
          entityType: "product",
          entityId: p.id,
          entityLabel: p.title?.slice(0, 30) || p.id.slice(-8),
        });
      }

      // Sort all entries by timestamp descending
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return entries;
    });

    // Paginate
    const total = activities.length;
    const paginated = activities.slice(skip, skip + take);

    return { activities: paginated, total };
  });
}
