/**
 * RLS-Aware Transaction Helper
 * ============================
 * Ensures PostgreSQL RLS session variables and Prisma queries
 * run on the SAME pooled connection by wrapping everything
 * in an interactive $transaction with SET LOCAL.
 *
 * Why this is needed:
 * - Prisma uses connection pooling; set_config(..., false) sets session-level
 *   variables on ONE connection, but subsequent queries may use a DIFFERENT connection.
 * - $transaction guarantees all operations use the same connection.
 * - SET LOCAL (set_config with true) scopes variables to the transaction only,
 *   preventing leakage to other requests sharing the same pooled connection.
 *
 * Usage:
 *   const result = await withRls(prisma, request, async (tx) => {
 *     const [items, count] = await Promise.all([
 *       tx.product.findMany({ where }),
 *       tx.product.count({ where }),
 *     ]);
 *     return { items, count };
 *   });
 */

import { PrismaClient } from "@prisma/client";
import { FastifyRequest } from "fastify";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Execute a callback inside a Prisma interactive transaction
 * with RLS context set via SET LOCAL (transaction-scoped).
 */
export async function withRls<T>(
  prisma: PrismaClient,
  request: FastifyRequest,
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  const role = (request as any).authUser?.role || "NONE";
  const vendorId = (request as any).authUser?.vendorId || "__NONE__";

  return prisma.$transaction(async (tx: any) => {
    // SET LOCAL — scoped to this transaction only
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_user_role', $1, true)`,
      role
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_vendor_id', $1, true)`,
      vendorId
    );

    return callback(tx);
  });
}

/**
 * Execute a callback inside a Prisma interactive transaction
 * with RLS context for background workers (no HTTP request).
 */
export async function withWorkerRls<T>(
  prisma: PrismaClient,
  callback: (tx: TransactionClient) => Promise<T>,
  role: string = "RETAILER_LT",
  vendorId: string = "__NONE__"
): Promise<T> {
  return prisma.$transaction(async (tx: any) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_user_role', $1, true)`,
      role
    );
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_vendor_id', $1, true)`,
      vendorId
    );

    return callback(tx);
  });
}
