import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

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

dotenv.config();

const prisma = new PrismaClient();

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
});

// Plugins
await app.register(cors, {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "dev-secret",
});

// Decorate with prisma
app.decorate("prisma", prisma);

// Auth hook
app.decorate("authenticate", async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "Unauthorized" });
  }
});

// Health check
app.get("/api/health", async () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  version: "1.0.0",
}));

// Register routes
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

// Graceful shutdown
const gracefulShutdown = async () => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start
const port = parseInt(process.env.PORT || "4000", 10);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`🚀 LITE Platform API running on port ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app, prisma };
