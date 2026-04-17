/**
 * LITE Platform — Fastify Server Entry Point
 * ============================================
 * Phase 1 Security Foundation Applied:
 * - @fastify/helmet for security headers
 * - @fastify/rate-limit for API rate limiting
 * - @fastify/cors for cross-origin resource sharing
 * - @fastify/cookie for secure refresh token cookies
 * - @fastify/jwt for access token verification
 * - Global auth hook on all /api/* except public routes
 * - Zod validation on all request bodies
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import { registerGlobalAuthHook } from "./middleware/auth.js";
import { registerRlsHook } from "./middleware/rls.js";
import { authRoutes } from "./routes/auth.js";
import { vendorRoutes } from "./routes/vendors.js";
import { productRoutes } from "./routes/products.js";
import { orderRoutes } from "./routes/orders.js";
import { shipmentRoutes } from "./routes/shipments.js";
import { returnRoutes } from "./routes/returns.js";
import { financeRoutes } from "./routes/finance.js";
import { messageRoutes } from "./routes/messages.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { queueRoutes } from "./routes/queues.js";
import { activityRoutes } from "./routes/activity.js";
import { startAllWorkers, stopAllWorkers } from "./workers/index.js";
import { closeAllQueues } from "./queues/index.js";

dotenv.config();

// ============================================================
// Prisma Client
// ============================================================

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// ============================================================
// Fastify Instance
// ============================================================

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

// ============================================================
// Security Plugins
// ============================================================

// Helmet — security headers (CSP, HSTS, X-Frame-Options, etc.)
await app.register(helmet, {
  contentSecurityPolicy: false, // Disable CSP for dev; enable in production
});

// Rate Limiting — in-memory for now, Redis-backed when Redis is added in Phase 3
await app.register(rateLimit, {
  max: 100, // 100 requests per minute per IP
  timeWindow: "1 minute",
  // When Redis is added in Phase 3, configure:
  // redis: new Redis({ host: process.env.REDIS_HOST, port: 6379 })
});

// CORS
await app.register(cors, {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Cookie support for refresh tokens
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || "dev-cookie-secret",
});

// JWT for access tokens
await app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret",
});

// ============================================================
// Decorate Fastify with shared resources
// ============================================================

app.decorate("prisma", prisma);

// ============================================================
// Global Auth Hook — enforces authentication on all /api/* routes
// except explicitly public routes (/api/auth/login, /api/auth/refresh, /api/health)
// ============================================================

registerGlobalAuthHook(app);

// ============================================================
// PostgreSQL RLS Context Hook — sets session variables for tenant isolation
// Must be registered AFTER auth hook so request.authUser is available
// ============================================================

registerRlsHook(app, prisma);

// ============================================================
// Health Check (public — no auth required)
// ============================================================

app.get("/api/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development",
}));

// ============================================================
// Route Registration
// ============================================================

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(vendorRoutes, { prefix: "/api/vendors" });
await app.register(productRoutes, { prefix: "/api/products" });
await app.register(orderRoutes, { prefix: "/api/orders" });
await app.register(shipmentRoutes, { prefix: "/api/shipments" });
await app.register(returnRoutes, { prefix: "/api/returns" });
await app.register(financeRoutes, { prefix: "/api/finance" });
await app.register(messageRoutes, { prefix: "/api/messages" });
await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
await app.register(analyticsRoutes, { prefix: "/api/analytics" });
await app.register(queueRoutes, { prefix: "/api/queues" });
await app.register(activityRoutes, { prefix: "/api/activity" });

// ============================================================
// Global Error Handler
// ============================================================

app.setErrorHandler((error: any, request: any, reply: any) => {
  const statusCode = error.statusCode || 500;

  // Log server errors
  if (statusCode >= 500) {
    app.log.error(error);
  }

  // Don't leak internal errors in production
  const message =
    process.env.NODE_ENV === "production" && statusCode >= 500
      ? "Internal Server Error"
      : error.message;

  reply.status(statusCode).send({
    error: error.name || "Error",
    message,
    statusCode,
  });
});

// ============================================================
// Graceful Shutdown
// ============================================================

const gracefulShutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down gracefully...`);
  await stopAllWorkers();
  await closeAllQueues();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ============================================================
// Start Server
// ============================================================

const port = parseInt(process.env.PORT || "4000", 10);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 LITE Platform API running on port ${port}`);
  console.log(`🔒 Security: helmet, rate-limit, CORS, global auth hook enabled`);

  // Start BullMQ workers if Redis is available
  if (process.env.ENABLE_WORKERS !== "false") {
    try {
      startAllWorkers();
      console.log(`⚡ BullMQ workers started`);
    } catch (err) {
      console.warn(`⚠️  BullMQ workers not started (Redis unavailable):`, (err as Error).message);
    }
  }
  console.log(`📋 Routes: ${app.printRoutes()}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app, prisma };
