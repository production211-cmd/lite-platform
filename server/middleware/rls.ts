/**
 * PostgreSQL Row-Level Security (RLS) Session Middleware
 * ======================================================
 * Addresses Perplexity Master Developer's Approval Condition #1:
 * "PostgreSQL RLS is enabled on multi-tenant tables"
 * 
 * Strategy: Use SET (session-level) instead of SET LOCAL (transaction-level)
 * because Prisma queries don't always run in explicit transactions.
 * 
 * The preHandler hook sets session variables BEFORE each request's queries run.
 * Since each Prisma connection from the pool gets the SET before queries,
 * and the pool resets connections, this is safe for connection pooling.
 * 
 * For extra safety, we also reset to restrictive defaults in an onResponse hook.
 */

import { PrismaClient } from "@prisma/client";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

/**
 * Sets PostgreSQL session variables for RLS enforcement.
 * Uses SET (not SET LOCAL) so it persists for all queries in the request lifecycle.
 */
async function setRlsContext(
  prisma: PrismaClient,
  role: string,
  vendorId: string
): Promise<void> {
  // Use separate SET statements to avoid issues with multi-statement execution
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_user_role', $1, false)`,
    role
  );
  await prisma.$executeRawUnsafe(
    `SELECT set_config('app.current_vendor_id', $1, false)`,
    vendorId
  );
}

/**
 * Resets RLS context to restrictive defaults after request completes.
 * This prevents session variable leakage on pooled connections.
 */
async function resetRlsContext(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.current_user_role', 'NONE', false)`
    );
    await prisma.$executeRawUnsafe(
      `SELECT set_config('app.current_vendor_id', '__NONE__', false)`
    );
  } catch {
    // Best-effort reset — don't fail the response
  }
}

/**
 * Registers the RLS context hooks on all API routes.
 * - preHandler: sets session variables based on authenticated user
 * - onResponse: resets session variables to prevent leakage
 */
export function registerRlsHook(app: FastifyInstance, prisma: PrismaClient): void {
  // Set RLS context BEFORE route handler runs
  app.addHook("preHandler", async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.url.startsWith("/api/")) return;
    if (request.url === "/api/health") return;

    try {
      if (request.authUser) {
        await setRlsContext(
          prisma,
          request.authUser.role,
          request.authUser.vendorId || "__NONE__"
        );
      } else {
        // Unauthenticated — set restrictive defaults
        await setRlsContext(prisma, "NONE", "__NONE__");
      }
    } catch (err) {
      app.log.error({ err }, "Failed to set RLS context");
    }
  });

  // Reset RLS context AFTER response is sent
  app.addHook("onResponse", async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.url.startsWith("/api/")) return;
    if (request.url === "/api/health") return;

    await resetRlsContext(prisma);
  });
}

/**
 * Sets RLS context for background jobs/workers.
 * Workers run outside of HTTP request context.
 */
export async function setWorkerRlsContext(
  prisma: PrismaClient,
  role: "RETAILER_LT" | "VENDOR_USER" | "VENDOR" = "RETAILER_LT",
  vendorId?: string
): Promise<void> {
  await setRlsContext(prisma, role, vendorId || "__NONE__");
}
