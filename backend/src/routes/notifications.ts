import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser } from "../lib/auth-context";
import { prisma } from "../prisma";

const notificationsRouter = new Hono<{ Variables: AppVariables }>();

notificationsRouter.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ data: items });
});

notificationsRouter.post("/read-all", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return c.json({ data: { ok: true } });
});

notificationsRouter.post("/:id/read", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const existing = await prisma.notification.findFirst({
    where: { id: c.req.param("id"), userId: user.id },
  });
  if (!existing) return c.json({ error: { message: "Notification not found", code: "NOT_FOUND" } }, 404);

  const updated = await prisma.notification.update({
    where: { id: existing.id },
    data: { readAt: existing.readAt ?? new Date() },
  });

  return c.json({ data: updated });
});

export { notificationsRouter };
