import { FastifyInstance } from "fastify";

export async function vendorRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/vendors - list all vendors
  app.get("/", async (request) => {
    const { search, location, economicModel, status, page = "1", limit = "20" } =
      request.query as any;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    if (location) where.location = location;
    if (economicModel) where.economicModel = economicModel;
    if (status !== undefined) where.isActive = status === "active";

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: { select: { products: true, subOrders: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.count({ where }),
    ]);

    return { vendors, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/vendors/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        connectorConfig: true,
        _count: {
          select: { products: true, subOrders: true, returns: true, payouts: true },
        },
      },
    });
    if (!vendor) return { error: "Vendor not found" };
    return vendor;
  });

  // POST /api/vendors
  app.post("/", async (request) => {
    const data = request.body as any;
    const vendor = await prisma.vendor.create({ data });
    return vendor;
  });

  // PUT /api/vendors/:id
  app.put("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const vendor = await prisma.vendor.update({ where: { id }, data });
    return vendor;
  });

  // GET /api/vendors/:id/performance
  app.get("/:id/performance", async (request) => {
    const { id } = request.params as { id: string };
    const metrics = await prisma.vendorPerformance.findMany({
      where: { vendorId: id },
      orderBy: { period: "desc" },
      take: 12,
    });
    return metrics;
  });

  // GET /api/vendors/:id/products
  app.get("/:id/products", async (request) => {
    const { id } = request.params as { id: string };
    const { status, page = "1", limit = "20" } = request.query as any;

    const where: any = { vendorId: id };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: { images: { take: 1 }, variants: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  });

  // GET /api/vendors/:id/orders
  app.get("/:id/orders", async (request) => {
    const { id } = request.params as { id: string };
    const { status, page = "1", limit = "20" } = request.query as any;

    const where: any = { vendorId: id };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subOrders, total] = await Promise.all([
      prisma.subOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          order: true,
          items: { include: { product: { include: { images: { take: 1 } } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subOrder.count({ where }),
    ]);

    return { orders: subOrders, total };
  });
}
