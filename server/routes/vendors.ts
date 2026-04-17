/**
 * Vendor Routes — CRUD with RBAC & Tenant Scoping
 * ==================================================
 * Phase 1 Security Foundation Applied:
 * - All routes require authentication (global hook)
 * - requireRole() for write operations (RETAILER_LT only)
 * - getTenantFilter() for vendor data isolation
 * - canAccessVendor() for detail/sub-resource access
 * - Zod validation on all request bodies
 * - withRls() for RLS-safe queries on multi-tenant tables
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole, getTenantFilter, canAccessVendor } from "../middleware/auth.js";
import { withRls } from "../lib/rls-tx.js";
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  VendorFilterSchema,
} from "../lib/schemas.js";

export async function vendorRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // ============================================================
  // GET /api/vendors — List vendors (filtered by role)
  // ============================================================
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const queryResult = VendorFilterSchema.safeParse(request.query);
    const query = queryResult.success
      ? queryResult.data
      : { page: 1, limit: 20, sortOrder: "desc" as const };

    const tenantFilter = getTenantFilter(request);
    const where: any = { ...tenantFilter };

    if (query.economicModel) where.economicModel = query.economicModel;
    if (query.location) where.location = query.location;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { slug: { contains: query.search, mode: "insensitive" } },
        { contactEmail: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    // Use withRls because _count.products queries the RLS-protected Product table
    const { vendors, total } = await withRls(prisma, request, async (tx) => {
      const [vendors, total] = await Promise.all([
        tx.vendor.findMany({
          where,
          skip,
          take: query.limit,
          orderBy: { createdAt: query.sortOrder },
          include: {
            _count: { select: { products: true, vendorOrders: true, users: true } },
          },
        }),
        tx.vendor.count({ where }),
      ]);
      return { vendors, total };
    });

    return {
      vendors,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  });

  // ============================================================
  // GET /api/vendors/:id — Get vendor detail
  // ============================================================
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    if (!canAccessVendor(request, id)) {
      return reply.status(403).send({ error: "Access denied to this vendor" });
    }

    // Use withRls because _count includes RLS-protected tables
    const vendor = await withRls(prisma, request, async (tx) => {
      return tx.vendor.findUnique({
        where: { id },
        include: {
          connectorConfig: true,
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              products: true,
              vendorOrders: true,
              shipments: true,
              returns: true,
              payouts: true,
              settlements: true,
            },
          },
        },
      });
    });

    if (!vendor) {
      return reply.status(404).send({ error: "Vendor not found" });
    }

    return vendor;
  });

  // ============================================================
  // POST /api/vendors — Create vendor (RETAILER_LT only)
  // ============================================================
  app.post(
    "/",
    { preHandler: [requireRole("RETAILER_LT")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = CreateVendorSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation Error",
          details: parseResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      const data = parseResult.data;

      const existing = await prisma.vendor.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        return reply.status(409).send({ error: "Vendor slug already exists" });
      }

      const vendor = await withRls(prisma, request, async (tx) => {
        return tx.vendor.create({ data });
      });
      return reply.status(201).send(vendor);
    }
  );

  // ============================================================
  // PUT /api/vendors/:id — Update vendor (RETAILER_LT only)
  // ============================================================
  app.put(
    "/:id",
    { preHandler: [requireRole("RETAILER_LT")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const parseResult = UpdateVendorSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: "Validation Error",
          details: parseResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        });
      }

      const vendor = await prisma.vendor.findUnique({ where: { id } });
      if (!vendor) {
        return reply.status(404).send({ error: "Vendor not found" });
      }

      const updated = await withRls(prisma, request, async (tx) => {
        return tx.vendor.update({
          where: { id },
          data: parseResult.data,
        });
      });

      return updated;
    }
  );

  // ============================================================
  // DELETE /api/vendors/:id — Soft-delete vendor (RETAILER_LT only)
  // ============================================================
  app.delete(
    "/:id",
    { preHandler: [requireRole("RETAILER_LT")] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      const vendor = await prisma.vendor.findUnique({ where: { id } });
      if (!vendor) {
        return reply.status(404).send({ error: "Vendor not found" });
      }

      await withRls(prisma, request, async (tx) => {
        return tx.vendor.update({
          where: { id },
          data: { isActive: false },
        });
      });

      return { success: true, message: "Vendor deactivated" };
    }
  );

  // ============================================================
  // GET /api/vendors/:id/performance — Vendor performance metrics
  // ============================================================
  app.get(
    "/:id/performance",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      if (!canAccessVendor(request, id)) {
        return reply.status(403).send({ error: "Access denied" });
      }

      // VendorPerformance has RLS
      const metrics = await withRls(prisma, request, async (tx) => {
        return tx.vendorPerformance.findMany({
          where: { vendorId: id },
          orderBy: { period: "desc" },
          take: 12,
        });
      });

      return metrics;
    }
  );

  // ============================================================
  // GET /api/vendors/:id/products — Vendor's products (scoped)
  // ============================================================
  app.get(
    "/:id/products",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      if (!canAccessVendor(request, id)) {
        return reply.status(403).send({ error: "Access denied" });
      }

      const { status, page = "1", limit = "20" } = request.query as any;

      const where: any = { vendorId: id };
      if (status) where.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Product table has RLS — must use withRls
      const { products, total } = await withRls(prisma, request, async (tx) => {
        const [products, total] = await Promise.all([
          tx.product.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: { images: { take: 1 }, variants: true },
            orderBy: { createdAt: "desc" },
          }),
          tx.product.count({ where }),
        ]);
        return { products, total };
      });

      return { products, total };
    }
  );

  // ============================================================
  // GET /api/vendors/:id/orders — Vendor's orders (scoped)
  // ============================================================
  app.get(
    "/:id/orders",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      if (!canAccessVendor(request, id)) {
        return reply.status(403).send({ error: "Access denied" });
      }

      const { status, page = "1", limit = "20" } = request.query as any;

      const where: any = { vendorId: id };
      if (status) where.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // SubOrder (VendorOrder) has RLS — must use withRls
      const { vendorOrders, total } = await withRls(prisma, request, async (tx) => {
        const [vendorOrders, total] = await Promise.all([
          tx.vendorOrder.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
              order: true,
              items: {
                include: { product: { include: { images: { take: 1 } } } },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          tx.vendorOrder.count({ where }),
        ]);
        return { vendorOrders, total };
      });

      return { orders: vendorOrders, total };
    }
  );
}
