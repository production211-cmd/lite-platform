/**
 * Token Service — Refresh Token Family Tracking
 * ===============================================
 * Phase 1 Security Foundation
 * 
 * Implements:
 * - 15-minute access tokens (JWT)
 * - 7-day refresh tokens stored in DB with familyId
 * - Reuse detection: if a used token is replayed, revoke entire family
 * - httpOnly secure cookie delivery for refresh tokens
 */

import { FastifyInstance, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

// ============================================================
// Constants
// ============================================================

export const ACCESS_TOKEN_EXPIRY = "15m";
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const REFRESH_COOKIE_NAME = "lite_refresh_token";

// ============================================================
// Token Generation
// ============================================================

/**
 * Generate a cryptographically secure random token string.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

/**
 * Generate a unique family ID for a new login session.
 */
export function generateFamilyId(): string {
  return randomBytes(16).toString("base64url");
}

// ============================================================
// Token Lifecycle
// ============================================================

/**
 * Create a new token pair (access + refresh) for a user.
 * Called on initial login.
 */
export async function createTokenPair(
  app: FastifyInstance,
  prisma: PrismaClient,
  user: { id: string; email: string; role: string; vendorId: string | null }
): Promise<{ accessToken: string; refreshToken: string }> {
  // Generate access token (short-lived JWT)
  const accessToken = app.jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
    },
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Generate refresh token (long-lived, stored in DB)
  const refreshToken = generateRefreshToken();
  const familyId = generateFamilyId();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      familyId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Rotate a refresh token — issue new pair, mark old as used.
 * Implements reuse detection: if the old token was already used,
 * revoke the entire family (potential token theft).
 */
export async function rotateRefreshToken(
  app: FastifyInstance,
  prisma: PrismaClient,
  oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string; user: any } | { error: string }> {
  // Find the existing refresh token
  const existingToken = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
    include: { user: { include: { vendor: true } } },
  });

  if (!existingToken) {
    return { error: "Invalid refresh token" };
  }

  // Check if token has expired
  if (existingToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({ where: { id: existingToken.id } });
    return { error: "Refresh token expired" };
  }

  // REUSE DETECTION: If this token was already used, someone is replaying it.
  // This means the token was likely stolen. Revoke the entire family.
  if (existingToken.usedAt) {
    // Revoke all tokens in this family — nuclear option
    await prisma.refreshToken.deleteMany({
      where: { familyId: existingToken.familyId },
    });
    return { error: "Token reuse detected — all sessions revoked for security" };
  }

  // Mark old token as used (but don't delete — needed for reuse detection)
  await prisma.refreshToken.update({
    where: { id: existingToken.id },
    data: { usedAt: new Date() },
  });

  // Generate new token pair in the same family
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: existingToken.userId,
      familyId: existingToken.familyId, // Same family
      expiresAt,
    },
  });

  // Generate new access token
  const user = existingToken.user;
  const accessToken = app.jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId,
    },
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
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
}

/**
 * Revoke all refresh tokens for a user (logout from all devices).
 */
export async function revokeAllUserTokens(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * Revoke a specific refresh token family (single session logout).
 */
export async function revokeTokenFamily(
  prisma: PrismaClient,
  refreshToken: string
): Promise<void> {
  const token = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (token) {
    await prisma.refreshToken.deleteMany({
      where: { familyId: token.familyId },
    });
  }
}

/**
 * Clean up expired refresh tokens (run periodically).
 */
export async function cleanupExpiredTokens(prisma: PrismaClient): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ============================================================
// Cookie Helpers
// ============================================================

/**
 * Set refresh token as httpOnly secure cookie.
 */
export function setRefreshCookie(reply: FastifyReply, refreshToken: string): void {
  reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60, // seconds
  });
}

/**
 * Clear the refresh token cookie (on logout).
 */
export function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
}
