/**
 * User Management Routes — Admin-only CRUD
 * ==========================================
 * - All routes require RETAILER_LT role
 * - Uses withRls for RLS-safe queries
 * - Supports list, detail, create, update, deactivate
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole } from "../middleware/auth.js";
import { withRls } from "../lib/rls-tx.js";
import bcrypt from "bcryptjs";

export async function userRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;
  // All user management routes require admin
  app.addHook("preHandler", requireRole("RETAILER_LT"));

  // GET / — List all users with optional filters
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const { role, isActive, search, page = "1", limit = "50" } = request.query as any;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    return withRls(prisma, request, async (tx) => {
      const [users, total] = await Promise.all([
        tx.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            vendorId: true,
            vendor: { select: { id: true, name: true } },
            vendorAccess: { select: { portalType: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        tx.user.count({ where }),
      ]);

      return { users, total, page: parseInt(page), limit: take };
    });
  });

  // GET /stats — User counts by role and status
  app.get("/stats", async (request: FastifyRequest) => {
    return withRls(prisma, request, async (tx) => {
      const [total, byRole, active, inactive] = await Promise.all([
        tx.user.count(),
        tx.user.groupBy({ by: ["role"], _count: true }),
        tx.user.count({ where: { isActive: true } }),
        tx.user.count({ where: { isActive: false } }),
      ]);

      return { total, byRole, active, inactive };
    });
  });

  // GET /:id — Single user detail
  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    return withRls(prisma, request, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          vendorId: true,
          vendor: { select: { id: true, name: true } },
          vendorAccess: { select: { portalType: true } },
        },
      });

      if (!user) return reply.status(404).send({ error: "User not found" });
      return user;
    });
  });

  // PUT /:id — Update user (role, active status, name)
  app.put("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    // Only allow updating specific fields
    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    return withRls(prisma, request, async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });
      return user;
    });
  });

  // POST /:id/reset-password — Admin reset password
  app.post("/:id/reset-password", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { newPassword } = request.body as { newPassword: string };

    if (!newPassword || newPassword.length < 8) {
      return reply.status(400).send({ error: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    return withRls(prisma, request, async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash },
      });
      return { success: true, message: "Password reset successfully" };
    });
  });

  // PUT /:id/deactivate — Deactivate a user
  app.put("/:id/deactivate", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Prevent self-deactivation
    if ((request as any).authUser?.id === id) {
      return reply.status(400).send({ error: "Cannot deactivate your own account" });
    }

    return withRls(prisma, request, async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, email: true, isActive: true },
      });
      return user;
    });
  });

  // PUT /:id/activate — Reactivate a user
  app.put("/:id/activate", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    return withRls(prisma, request, async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive: true },
        select: { id: true, email: true, isActive: true },
      });
      return user;
    });
  });
}
