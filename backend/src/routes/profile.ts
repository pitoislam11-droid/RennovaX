import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser } from "../lib/auth-context";
import { prisma } from "../prisma";
import { setRoleRequestSchema } from "../types";

const profileRouter = new Hono<{ Variables: AppVariables }>();

profileRouter.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    include: { roles: true, contractor: true },
  });
  if (!account) return c.json({ error: { message: "Account not found", code: "NOT_FOUND" } }, 404);

  return c.json({
    data: {
      id: account.id,
      name: account.name,
      email: account.email,
      image: account.image,
      activeRole: account.activeRole,
      roles: account.roles.map((role) => role.role),
      contractorProfile: account.contractor,
    },
  });
});

profileRouter.post("/roles", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const parsed = setRoleRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Choose a valid role", code: "INVALID_ROLE" } }, 400);
  const { role } = parsed.data;

  const account = await prisma.$transaction(async (tx) => {
    await tx.userRole.upsert({
      where: { userId_role: { userId: user.id, role } },
      update: {},
      create: { userId: user.id, role },
    });
    return tx.user.update({
      where: { id: user.id },
      data: { activeRole: role },
      include: { roles: true },
    });
  });

  return c.json({
    data: {
      activeRole: account.activeRole,
      roles: account.roles.map((item) => item.role),
    },
  });
});

/** App Store guideline: users must be able to initiate account deletion in-app. */
profileRouter.post("/delete", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  await prisma.$transaction(async (tx) => {
    await tx.message.deleteMany({ where: { senderId: user.id } });
    await tx.user.delete({ where: { id: user.id } });
  });

  return c.json({ data: { deleted: true } });
});

export { profileRouter };
