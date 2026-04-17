import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function returnRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/returns
  app.get("/", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Return, VendorOrder, Product all have RLS
    const { returns, total } = await withRls(prisma, request, async (tx) => {
      const [returns, total] = await Promise.all([
        tx.return.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            vendor: { select: { id: true, name: true } },
            vendorOrder: {
              include: {
                order: { select: { id: true, orderNumber: true, customerName: true } },
                items: { include: { product: { select: { id: true, title: true, images: { take: 1 } } } } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        tx.return.count({ where }),
      ]);
      return { returns, total };
    });

    return { returns, total };
  });

  // GET /api/returns/stats
  app.get("/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [total, initiated, inTransit, inspecting, approved, refunded] = await Promise.all([
        tx.return.count(),
        tx.return.count({ where: { status: "INITIATED" } }),
        tx.return.count({ where: { status: "IN_TRANSIT" } }),
        tx.return.count({ where: { status: "INSPECTING" } }),
        tx.return.count({ where: { status: "APPROVED" } }),
        tx.return.count({ where: { status: "REFUNDED" } }),
      ]);

      const refundTotal = await tx.return.aggregate({
        _sum: { refundAmount: true },
        where: { status: "REFUNDED" },
      });

      return { total, initiated, inTransit, inspecting, approved, refunded, totalRefunds: refundTotal._sum.refundAmount || 0 };
    });

    return result;
  });

  // GET /api/returns/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    const ret = await withRls(prisma, request, async (tx) => {
      return tx.return.findUnique({
        where: { id },
        include: {
          vendor: true,
          vendorOrder: {
            include: {
              order: true,
              items: { include: { product: { include: { images: true } }, variant: true } },
            },
          },
        },
      });
    });

    if (!ret) return { error: "Return not found" };
    return ret;
  });

  // PUT /api/returns/:id/status
  app.put("/:id/status", async (request) => {
    const { id } = request.params as { id: string };
    const { status, notes } = request.body as { status: string; notes?: string };
    const data: any = { status };
    if (status === "RECEIVED_WAREHOUSE") data.receivedAt = new Date();
    if (status === "INSPECTING") data.inspectedAt = new Date();
    if (status === "COMPLETED") data.completedAt = new Date();
    if (notes) data.inspectionNotes = notes;

    const ret = await withRls(prisma, request, async (tx) => {
      return tx.return.update({ where: { id }, data });
    });
    return ret;
  });
}
