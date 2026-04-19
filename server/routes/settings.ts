/**
 * Platform Settings Routes — Admin Config CRUD
 * ==============================================
 * - GET /           — List all settings (optionally by category)
 * - GET /:key       — Get a single setting by key
 * - PUT /bulk       — Upsert multiple settings at once (MUST be before /:key)
 * - PUT /:key       — Upsert a setting by key
 * All routes require RETAILER_LT role.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireRole } from "../middleware/auth.js";
import { withRls } from "../lib/rls-tx.js";

export async function settingsRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;
  app.addHook("preHandler", requireRole("RETAILER_LT"));

  // GET / — List all settings, optionally filtered by category
  app.get("/", async (request: FastifyRequest) => {
    const { category } = request.query as { category?: string };
    const where: any = {};
    if (category) where.category = category;

    return withRls(prisma, request, async (tx) => {
      const settings = await tx.platformSetting.findMany({
        where,
        orderBy: [{ category: "asc" }, { key: "asc" }],
      });
      return { settings };
    });
  });

  // GET /:key — Get single setting
  app.get("/:key", async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };

    return withRls(prisma, request, async (tx) => {
      const setting = await tx.platformSetting.findUnique({ where: { key } });
      if (!setting) return reply.status(404).send({ error: "Setting not found" });
      return setting;
    });
  });

  // PUT /bulk — Upsert multiple settings at once
  // IMPORTANT: Must be registered BEFORE /:key to avoid route shadowing
  app.put("/bulk", async (request: FastifyRequest, reply: FastifyReply) => {
    const { settings } = request.body as {
      settings: { key: string; value: string; category?: string; label?: string }[];
    };

    if (!Array.isArray(settings) || settings.length === 0) {
      return reply.status(400).send({ error: "Settings array is required" });
    }
    if (settings.length > 50) {
      return reply.status(400).send({ error: "Maximum 50 settings per request" });
    }

    const userId = (request as any).authUser?.id;

    return withRls(prisma, request, async (tx) => {
      const results = await Promise.all(
        settings.map((s) =>
          tx.platformSetting.upsert({
            where: { key: s.key },
            update: { value: String(s.value), updatedBy: userId },
            create: {
              key: s.key,
              value: String(s.value),
              category: s.category || "general",
              label: s.label || s.key,
              updatedBy: userId,
            },
          })
        )
      );
      return { updated: results.length, settings: results };
    });
  });

  // PUT /:key — Upsert a single setting
  app.put("/:key", async (request: FastifyRequest, reply: FastifyReply) => {
    const { key } = request.params as { key: string };
    const { value, category, label, description } = request.body as {
      value: string;
      category?: string;
      label?: string;
      description?: string;
    };

    if (value === undefined || value === null) {
      return reply.status(400).send({ error: "Value is required" });
    }

    const userId = (request as any).authUser?.id;

    return withRls(prisma, request, async (tx) => {
      const setting = await tx.platformSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          ...(category ? { category } : {}),
          ...(label ? { label } : {}),
          ...(description ? { description } : {}),
          updatedBy: userId,
        },
        create: {
          key,
          value: String(value),
          category: category || "general",
          label: label || key,
          description: description || "",
          updatedBy: userId,
        },
      });
      return setting;
    });
  });
}
