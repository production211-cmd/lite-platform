/**
 * Auth Routes — Login, Refresh, Logout, Me
 * ==========================================
 * Phase 1 Security Foundation
 * 
 * - POST /api/auth/login — authenticate, return access token + set refresh cookie
 * - POST /api/auth/refresh — rotate refresh token, return new access token
 * - POST /api/auth/logout — revoke refresh token family, clear cookie
 * - GET /api/auth/me — return current user info (requires auth)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { LoginSchema } from "../lib/schemas.js";
import {
  createTokenPair,
  rotateRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} from "../lib/tokens.js";

export async function authRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // ============================================================
  // POST /api/auth/login (PUBLIC — no auth required)
  // ============================================================
  app.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    // Validate request body
    const parseResult = LoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: "Validation Error",
        details: parseResult.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const { email, password } = parseResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendor: true },
    });

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: "Account is deactivated" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create token pair (access + refresh)
    const { accessToken, refreshToken } = await createTokenPair(app, prisma, {
      id: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
    });

    // Set refresh token as httpOnly cookie
    setRefreshCookie(reply, refreshToken);

    // Return access token in body (for Authorization header use)
    // Refresh token is ONLY in the cookie — never in the response body
    return {
      token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        vendorId: user.vendorId,
        vendorName: user.vendor?.name,
      },
    };
  });

  // ============================================================
  // POST /api/auth/refresh (PUBLIC — no auth required, uses cookie)
  // ============================================================
  app.post("/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    // Get refresh token from cookie
    const oldRefreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (!oldRefreshToken) {
      return reply.status(401).send({ error: "No refresh token provided" });
    }

    // Rotate the token
    const result = await rotateRefreshToken(app, prisma, oldRefreshToken);

    if ("error" in result) {
      clearRefreshCookie(reply);
      return reply.status(401).send({ error: result.error });
    }

    // Set new refresh token cookie
    setRefreshCookie(reply, result.refreshToken);

    return {
      token: result.accessToken,
      user: result.user,
    };
  });

  // ============================================================
  // POST /api/auth/logout (requires auth)
  // ============================================================
  app.post("/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (refreshToken) {
      // Revoke the entire token family for this session
      await revokeTokenFamily(prisma, refreshToken);
    }

    clearRefreshCookie(reply);
    return { success: true, message: "Logged out successfully" };
  });

  // ============================================================
  // POST /api/auth/logout-all (requires auth — revoke all sessions)
  // ============================================================
  app.post("/logout-all", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      return reply.status(401).send({ error: "Authentication required" });
    }

    await revokeAllUserTokens(prisma, request.authUser.id);
    clearRefreshCookie(reply);

    return { success: true, message: "All sessions revoked" };
  });

  // ============================================================
  // GET /api/auth/me (requires auth — handled by global hook)
  // ============================================================
  app.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.authUser) {
      return reply.status(401).send({ error: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: request.authUser.id },
      include: { vendor: true },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      vendorId: user.vendorId,
      vendorName: user.vendor?.name,
      lastLoginAt: user.lastLoginAt,
    };
  });
}
