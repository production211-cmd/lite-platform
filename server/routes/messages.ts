import { FastifyInstance } from "fastify";
import { withRls } from "../lib/rls-tx.js";

export async function messageRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // GET /api/messages/threads
  app.get("/threads", async (request) => {
    const {
      vendorId, department, status, priority, assignedToId,
      page = "1", limit = "20",
    } = request.query as any;

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (department) where.department = department;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // MessageThread has RLS
    const { threads, total } = await withRls(prisma, request, async (tx) => {
      const [threads, total] = await Promise.all([
        tx.messageThread.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            vendor: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: "desc" },
        }),
        tx.messageThread.count({ where }),
      ]);
      return { threads, total };
    });

    return { threads, total };
  });

  // GET /api/messages/threads/:id
  app.get("/threads/:id", async (request) => {
    const { id } = request.params as { id: string };

    const thread = await withRls(prisma, request, async (tx) => {
      return tx.messageThread.findUnique({
        where: { id },
        include: {
          vendor: true,
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          messages: {
            include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    if (!thread) return { error: "Thread not found" };
    return thread;
  });

  // POST /api/messages/threads
  app.post("/threads", async (request) => {
    const data = request.body as any;

    const thread = await withRls(prisma, request, async (tx) => {
      return tx.messageThread.create({
        data: {
          ...data,
          slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    });
    return thread;
  });

  // POST /api/messages/threads/:id/messages
  app.post("/threads/:id/messages", async (request) => {
    const { id } = request.params as { id: string };
    const { senderId, content, isInternal } = request.body as any;

    const message = await withRls(prisma, request, async (tx) => {
      const msg = await tx.message.create({
        data: { threadId: id, senderId, content, isInternal: isInternal || false },
      });
      await tx.messageThread.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
      return msg;
    });

    return message;
  });

  // PUT /api/messages/threads/:id/assign
  app.put("/threads/:id/assign", async (request) => {
    const { id } = request.params as { id: string };
    const { assignedToId } = request.body as { assignedToId: string };

    const thread = await withRls(prisma, request, async (tx) => {
      return tx.messageThread.update({
        where: { id },
        data: { assignedToId },
      });
    });
    return thread;
  });

  // PUT /api/messages/threads/:id/status
  app.put("/threads/:id/status", async (request) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const data: any = { status };
    if (status === "RESOLVED") data.resolvedAt = new Date();
    if (status === "CLOSED") data.closedAt = new Date();

    const thread = await withRls(prisma, request, async (tx) => {
      return tx.messageThread.update({ where: { id }, data });
    });
    return thread;
  });

  // GET /api/messages/stats
  app.get("/stats", async (request) => {
    const result = await withRls(prisma, request, async (tx) => {
      const [total, open, pending, resolved, urgent] = await Promise.all([
        tx.messageThread.count(),
        tx.messageThread.count({ where: { status: "OPEN" } }),
        tx.messageThread.count({ where: { status: "PENDING" } }),
        tx.messageThread.count({ where: { status: "RESOLVED" } }),
        tx.messageThread.count({ where: { priority: "URGENT" } }),
      ]);

      const slaBreach = await tx.messageThread.count({
        where: {
          status: { in: ["OPEN", "PENDING"] },
          slaDeadline: { lt: new Date() },
        },
      });

      return { total, open, pending, resolved, urgent, slaBreach };
    });

    return result;
  });
}
