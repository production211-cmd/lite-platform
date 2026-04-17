import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";

export async function authRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma;

  // POST /api/auth/login
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendor: true },
    });

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = app.jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        vendorId: user.vendorId,
      },
      { expiresIn: "24h" }
    );

    return {
      token,
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

  // GET /api/auth/me
  app.get(
    "/me",
    { preHandler: [(app as any).authenticate] },
    async (request) => {
      const { id } = request.user as any;
      const user = await prisma.user.findUnique({
        where: { id },
        include: { vendor: true },
      });
      if (!user) return { error: "User not found" };
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        vendorId: user.vendorId,
        vendorName: user.vendor?.name,
      };
    }
  );
}
