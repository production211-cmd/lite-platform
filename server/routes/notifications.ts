/**
 * Notification Routes — User Notifications CRUD
 * ===============================================
 * - GET /           — List notifications for current user (paginated, filterable)
 * - GET /unread-count — Quick unread count
 * - PUT /:id/read   — Mark single notification as read
 * - PUT /read-all   — Mark all notifications as read
 * - DELETE /:id     — Dismiss/delete a notification
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function notificationRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET / — List notifications for the authenticated user
  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).authUser?.id;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const { type, priority, isRead, page = "1", limit = "30" } = request.query as any;

    const p = Math.max(1, parseInt(page) || 1);
    const t = Math.min(100, Math.max(1, parseInt(limit) || 30));
    const skip = (p - 1) * t;

    const where: any = { userId };
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isRead !== undefined) where.isRead = isRead === "true";

    return withRls(prisma, request, async (tx) => {
      const [notifications, total] = await Promise.all([
        tx.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: t,
        }),
        tx.notification.count({ where }),
      ]);

      return { notifications, total, page: p, limit: t };
    });
  });

  // GET /unread-count — Quick unread count
  app.get("/unread-count", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).authUser?.id;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    return withRls(prisma, request, async (tx) => {
      const count = await tx.notification.count({
        where: { userId, isRead: false },
      });
      return { unreadCount: count };
    });
  });

  // PUT /:id/read — Mark single notification as read
  app.put("/:id/read", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).authUser?.id;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const { id } = request.params as { id: string };

    return withRls(prisma, request, async (tx) => {
      const notification = await tx.notification.findFirst({
        where: { id, userId },
      });
      if (!notification) return reply.status(404).send({ error: "Notification not found" });

      await tx.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return { success: true };
    });
  });

  // PUT /read-all — Mark all notifications as read for current user
  app.put("/read-all", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).authUser?.id;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    return withRls(prisma, request, async (tx) => {
      const result = await tx.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return { success: true, count: result.count };
    });
  });

  // DELETE /:id — Dismiss a notification
  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request as any).authUser?.id;
    if (!userId) return reply.status(401).send({ error: "Unauthorized" });

    const { id } = request.params as { id: string };

    return withRls(prisma, request, async (tx) => {
      const notification = await tx.notification.findFirst({
        where: { id, userId },
      });
      if (!notification) return reply.status(404).send({ error: "Notification not found" });

      await tx.notification.delete({ where: { id } });
      return { success: true };
    });
  });
}
