import { FastifyInstance } from "fastify";

export async function productRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/products - list with filters
  app.get("/", async (request) => {
    const {
      search, vendorId, status, category, brand, minPrice, maxPrice,
      minScore, maxScore, page = "1", limit = "20", sortBy = "createdAt", sortOrder = "desc",
    } = request.query as any;

    const where: any = { isDeleted: false };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { vendorSku: { contains: search, mode: "insensitive" } },
        { retailerSku: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (minPrice) where.salesPrice = { ...where.salesPrice, gte: parseFloat(minPrice) };
    if (maxPrice) where.salesPrice = { ...where.salesPrice, lte: parseFloat(maxPrice) };
    if (minScore) where.enrichmentScore = { ...where.enrichmentScore, gte: parseInt(minScore) };
    if (maxScore) where.enrichmentScore = { ...where.enrichmentScore, lte: parseInt(maxScore) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          vendor: { select: { id: true, name: true, slug: true, location: true } },
          images: { take: 3, orderBy: { position: "asc" } },
          variants: true,
          _count: { select: { priceHistory: true } },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // GET /api/products/pending - pending review
  app.get("/pending", async (request) => {
    const { page = "1", limit = "20" } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { status: "PENDING_REVIEW", isDeleted: false },
        skip,
        take: parseInt(limit),
        include: {
          vendor: { select: { id: true, name: true, slug: true } },
          images: { take: 1 },
          variants: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where: { status: "PENDING_REVIEW", isDeleted: false } }),
    ]);

    return { products, total };
  });

  // GET /api/products/stats
  app.get("/stats", async () => {
    const [total, pending, approved, pushed, needsReview] = await Promise.all([
      prisma.product.count({ where: { isDeleted: false } }),
      prisma.product.count({ where: { status: "PENDING_REVIEW", isDeleted: false } }),
      prisma.product.count({ where: { status: "APPROVED", isDeleted: false } }),
      prisma.product.count({ where: { status: "PUSHED", isDeleted: false } }),
      prisma.product.count({ where: { status: "NEEDS_REVIEW", isDeleted: false } }),
    ]);

    const avgEnrichment = await prisma.product.aggregate({
      _avg: { enrichmentScore: true },
      where: { isDeleted: false },
    });

    return { total, pending, approved, pushed, needsReview, avgEnrichmentScore: avgEnrichment._avg.enrichmentScore || 0 };
  });

  // GET /api/products/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        vendor: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        priceHistory: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!product) return { error: "Product not found" };
    return product;
  });

  // PUT /api/products/:id
  app.put("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const product = await prisma.product.update({ where: { id }, data });
    return product;
  });

  // POST /api/products/:id/approve
  app.post("/:id/approve", async (request) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    return product;
  });

  // POST /api/products/:id/push
  app.post("/:id/push", async (request) => {
    const { id } = request.params as { id: string };
    const product = await prisma.product.update({
      where: { id },
      data: { status: "PUSHED", publishedAt: new Date() },
    });
    return product;
  });

  // POST /api/products/:id/reject
  app.post("/:id/reject", async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };
    const product = await prisma.product.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return product;
  });

  // GET /api/products/categories
  app.get("/categories", async () => {
    const categories = await prisma.product.groupBy({
      by: ["category"],
      _count: true,
      where: { isDeleted: false, category: { not: null } },
      orderBy: { _count: { category: "desc" } },
    });
    return categories;
  });
}
