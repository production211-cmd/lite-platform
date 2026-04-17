import { FastifyInstance } from "fastify";

export async function returnRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/returns
  app.get("/", async (request) => {
    const { vendorId, status, page = "1", limit = "20" } = request.query as any;
    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          vendor: { select: { id: true, name: true } },
          subOrder: {
            include: {
              order: { select: { id: true, orderNumber: true, customerName: true } },
              items: { include: { product: { select: { id: true, title: true, images: { take: 1 } } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.return.count({ where }),
    ]);

    return { returns, total };
  });

  // GET /api/returns/stats
  app.get("/stats", async () => {
    const [total, initiated, inTransit, inspecting, approved, refunded] = await Promise.all([
      prisma.return.count(),
      prisma.return.count({ where: { status: "INITIATED" } }),
      prisma.return.count({ where: { status: "IN_TRANSIT" } }),
      prisma.return.count({ where: { status: "INSPECTING" } }),
      prisma.return.count({ where: { status: "APPROVED" } }),
      prisma.return.count({ where: { status: "REFUNDED" } }),
    ]);

    const refundTotal = await prisma.return.aggregate({
      _sum: { refundAmount: true },
      where: { status: "REFUNDED" },
    });

    return { total, initiated, inTransit, inspecting, approved, refunded, totalRefunds: refundTotal._sum.refundAmount || 0 };
  });

  // GET /api/returns/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const ret = await prisma.return.findUnique({
      where: { id },
      include: {
        vendor: true,
        subOrder: {
          include: {
            order: true,
            items: { include: { product: { include: { images: true } }, variant: true } },
          },
        },
      },
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

    const ret = await prisma.return.update({ where: { id }, data });
    return ret;
  });
}
