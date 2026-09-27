import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser } from "../lib/auth-context";
import { prisma } from "../prisma";
import { sendMessageSchema } from "../types";

const messagesRouter = new Hono<{ Variables: AppVariables }>();

async function canAccessProject(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false as const, project: null, reason: "NOT_FOUND" as const };
  if (project.homeownerId === userId) return { ok: true as const, project, reason: null };
  const contractor = await prisma.contractorProfile.findUnique({ where: { userId } });
  if (!contractor) return { ok: false as const, project, reason: "FORBIDDEN" as const };
  const quote = await prisma.quote.findFirst({
    where: {
      projectId,
      contractorProfileId: contractor.id,
      status: { in: ["SUBMITTED", "ACCEPTED"] },
    },
  });
  if (!quote) return { ok: false as const, project, reason: "FORBIDDEN" as const };
  return { ok: true as const, project, reason: null };
}

messagesRouter.get("/threads", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const contractor = await prisma.contractorProfile.findUnique({ where: { userId: user.id } });
  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [
        { project: { homeownerId: user.id } },
        ...(contractor
          ? [{
              project: {
                quotes: {
                  some: {
                    contractorProfileId: contractor.id,
                    status: { in: ["SUBMITTED", "ACCEPTED"] },
                  },
                },
              },
            }]
          : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      project: { select: { id: true, title: true, locationLabel: true, status: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return c.json({ data: threads });
});

messagesRouter.get("/project/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const access = await canAccessProject(user.id, c.req.param("projectId"));
  if (!access.ok) {
    return c.json(
      { error: { message: access.reason === "NOT_FOUND" ? "Project not found" : "You cannot open this conversation", code: access.reason } },
      access.reason === "NOT_FOUND" ? 404 : 403,
    );
  }

  let thread = await prisma.messageThread.findFirst({
    where: { projectId: access.project!.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!thread) {
    thread = await prisma.messageThread.create({
      data: { projectId: access.project!.id },
      include: { messages: true },
    });
  }

  return c.json({ data: thread });
});

messagesRouter.post("/project/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Write a message first", code: "INVALID_MESSAGE" } }, 400);

  const access = await canAccessProject(user.id, c.req.param("projectId"));
  if (!access.ok) {
    return c.json(
      { error: { message: access.reason === "NOT_FOUND" ? "Project not found" : "You cannot message on this project", code: access.reason } },
      access.reason === "NOT_FOUND" ? 404 : 403,
    );
  }

  let thread = await prisma.messageThread.findFirst({ where: { projectId: access.project!.id } });
  if (!thread) {
    thread = await prisma.messageThread.create({ data: { projectId: access.project!.id } });
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: user.id,
      body: parsed.data.body.trim(),
    },
  });
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return c.json({ data: message }, 201);
});

export { messagesRouter };
