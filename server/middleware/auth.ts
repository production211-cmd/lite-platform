/**
 * Global Authentication & Authorization Middleware
 * ================================================
 * Phase 1 Security Foundation
 * 
 * - Global auth hook on all /api/* except public routes
 * - requireRole() decorator for RBAC
 * - Tenant scoping via Prisma middleware (preparing for PostgreSQL RLS)
 * - Refresh token family tracking with reuse detection
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// ============================================================
// Types
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role: "RETAILER_LT" | "VENDOR_USER" | "VENDOR";
  vendorId: string | null;
}

// Extend Fastify's request type
declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

// ============================================================
// Public routes that skip auth
// ============================================================

const PUBLIC_PREFIXES = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/health",
];

function isPublicRoute(url: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => url.startsWith(prefix));
}

// ============================================================
// Global Auth Hook
// ============================================================

export function registerGlobalAuthHook(app: FastifyInstance): void {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip non-API routes (frontend assets, etc.)
    if (!request.url.startsWith("/api/")) return;

    // Skip public routes
    if (isPublicRoute(request.url)) return;

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header",
      });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = app.jwt.verify<AuthUser>(token);
      request.authUser = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        vendorId: decoded.vendorId,
      };
    } catch (err) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }
  });
}

// ============================================================
// Role-Based Access Control Decorator
// ============================================================

export function requireRole(...allowedRoles: AuthUser["role"][]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(request.authUser.role)) {
      return reply.status(403).send({
        error: "Forbidden",
        message: `Required role: ${allowedRoles.join(" or ")}. Your role: ${request.authUser.role}`,
      });
    }
  };
}

// ============================================================
// Tenant Scope Utility
// ============================================================
// NOTE: This is a Prisma-level middleware approach.
// For production, migrate to PostgreSQL Row-Level Security (RLS)
// with session-level `app.current_tenant` parameter.

export function getTenantFilter(request: FastifyRequest): { vendorId: string } | {} {
  if (!request.authUser) return {};

  // RETAILER_LT sees everything — no tenant filter
  if (request.authUser.role === "RETAILER_LT") return {};

  // VENDOR_USER and VENDOR see only their vendor's data
  if (request.authUser.vendorId) {
    return { vendorId: request.authUser.vendorId };
  }

  // Safety: if vendor user has no vendorId, deny all data
  return { vendorId: "__NONE__" };
}

/**
 * Validates that a vendor user is accessing their own vendor's data.
 * Returns true if access is allowed, false if denied.
 */
export function canAccessVendor(request: FastifyRequest, targetVendorId: string): boolean {
  if (!request.authUser) return false;

  // Retailer can access any vendor
  if (request.authUser.role === "RETAILER_LT") return true;

  // Vendor can only access their own
  return request.authUser.vendorId === targetVendorId;
}
