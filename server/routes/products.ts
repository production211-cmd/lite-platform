import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

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

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const { products, total } = await withRls(prisma, request, async (tx) => {
      const [products, total] = await Promise.all([
        tx.product.findMany({
          where,
          skip,
          take: limitNum,
          include: {
            vendor: { select: { id: true, name: true, slug: true, location: true } },
            images: { take: 3, orderBy: { position: "asc" } },
            variants: true,
            _count: { select: { priceHistory: true } },
          },
          orderBy: { [sortBy]: sortOrder },
        }),
        tx.product.count({ where }),
      ]);
      return { products, total };
    });

    return { products, total, page: pageNum, limit: limitNum };
  });

  // GET /api/products/pending - pending review
  app.get("/pending", async (request) => {
    const { page = "1", limit = "20" } = request.query as any;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const { products, total } = await withRls(prisma, request, async (tx) => {
      const [products, total] = await Promise.all([
        tx.product.findMany({
          where: { status: "PENDING_REVIEW", isDeleted: false },
          skip,
          take: limitNum,
          include: {
            vendor: { select: { id: true, name: true, slug: true } },
            images: { take: 1 },
            variants: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        tx.product.count({ where: { status: "PENDING_REVIEW", isDeleted: false } }),
      ]);
      return { products, total };
    });

    return { products, total };
  });

  // GET /api/products/stats
  app.get("/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [total, pending, approved, pushed, needsReview] = await Promise.all([
        tx.product.count({ where: { isDeleted: false } }),
        tx.product.count({ where: { status: "PENDING_REVIEW", isDeleted: false } }),
        tx.product.count({ where: { status: "APPROVED", isDeleted: false } }),
        tx.product.count({ where: { status: "PUSHED", isDeleted: false } }),
        tx.product.count({ where: { status: "NEEDS_REVIEW", isDeleted: false } }),
      ]);

      const avgEnrichment = await tx.product.aggregate({
        _avg: { enrichmentScore: true },
        where: { isDeleted: false },
      });

      return { total, pending, approved, pushed, needsReview, avgEnrichmentScore: avgEnrichment._avg.enrichmentScore || 0 };
    });

    return result;
  });

  // GET /api/products/:id
  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };

    const product = await withRls(prisma, request, async (tx) => {
      return tx.product.findUnique({
        where: { id },
        include: {
          vendor: true,
          images: { orderBy: { position: "asc" } },
          variants: true,
          priceHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });
    });

    if (!product) return { error: "Product not found" };
    return product;
  });

  // PUT /api/products/:id
  app.put("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;

    const product = await withRls(prisma, request, async (tx) => {
      return tx.product.update({ where: { id }, data });
    });
    return product;
  });

  // POST /api/products/:id/approve
  app.post("/:id/approve", async (request) => {
    const { id } = request.params as { id: string };

    const product = await withRls(prisma, request, async (tx) => {
      return tx.product.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    });
    return product;
  });

  // POST /api/products/:id/push
  app.post("/:id/push", async (request) => {
    const { id } = request.params as { id: string };

    const product = await withRls(prisma, request, async (tx) => {
      return tx.product.update({
        where: { id },
        data: { status: "PUSHED", publishedAt: new Date() },
      });
    });
    return product;
  });

  // POST /api/products/:id/reject
  app.post("/:id/reject", async (request) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };

    const product = await withRls(prisma, request, async (tx) => {
      return tx.product.update({
        where: { id },
        data: { status: "REJECTED" },
      });
    });
    return product;
  });

  // POST /api/products/bulk-approve — Approve multiple products at once
  app.post("/bulk-approve", async (request, reply) => {
    const { ids } = request.body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: "ids array is required" });
    }
    if (ids.length > 200) {
      return reply.status(400).send({ error: "Maximum 200 products per bulk action" });
    }

    return withRls(prisma, request, async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: { in: ids }, status: { in: ["PENDING_REVIEW", "NEEDS_REVIEW"] } },
        data: { status: "APPROVED" },
      });
      return { success: true, approved: result.count };
    });
  });

  // POST /api/products/bulk-reject — Reject multiple products at once
  app.post("/bulk-reject", async (request, reply) => {
    const { ids, reason } = request.body as { ids?: string[]; reason?: string };
    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ error: "ids array is required" });
    }
    if (ids.length > 200) {
      return reply.status(400).send({ error: "Maximum 200 products per bulk action" });
    }

    return withRls(prisma, request, async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: { in: ids }, status: { in: ["PENDING_REVIEW", "NEEDS_REVIEW"] } },
        data: { status: "REJECTED" },
      });
      return { success: true, rejected: result.count };
    });
  });

  // GET /api/products/categories
  app.get("/categories", async (request) => {
    const categories = await withRls(prisma, request, async (tx) => {
      return tx.product.groupBy({
        by: ["category"],
        _count: true,
        where: { isDeleted: false, category: { not: null } },
        orderBy: { _count: { category: "desc" } },
      });
    });
    return categories;
  });
}
