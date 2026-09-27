import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { prisma } from "../prisma";
import { createProjectRequestSchema, publishProjectRequestSchema } from "../types";

const projectsRouter = new Hono<{ Variables: AppVariables }>();

projectsRouter.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Add the homeowner role to continue", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }
  const projects = await prisma.project.findMany({
    where: { homeownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { media: { orderBy: { sortOrder: "asc" } }, _count: { select: { quotes: true } } },
  });
  return c.json({ data: projects });
});

projectsRouter.get("/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Add the homeowner role to continue", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const project = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), homeownerId: user.id },
    include: { media: { orderBy: { sortOrder: "asc" } }, _count: { select: { quotes: true } } },
  });
  if (!project) return c.json({ error: { message: "Project not found", code: "PROJECT_NOT_FOUND" } }, 404);

  return c.json({ data: project });
});

projectsRouter.patch("/:projectId/publish", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Add the homeowner role to continue", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const parsed = publishProjectRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please confirm this project should be published", code: "INVALID_PROJECT_STATUS" } }, 400);

  const existing = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), homeownerId: user.id },
  });
  if (!existing) return c.json({ error: { message: "Project not found", code: "PROJECT_NOT_FOUND" } }, 404);

  const project = existing.status === "PUBLISHED"
    ? await prisma.project.findUniqueOrThrow({
        where: { id: existing.id },
        include: { media: { orderBy: { sortOrder: "asc" } }, _count: { select: { quotes: true } } },
      })
    : await prisma.project.update({
        where: { id: existing.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
        include: { media: { orderBy: { sortOrder: "asc" } }, _count: { select: { quotes: true } } },
      });

  return c.json({ data: project });
});

projectsRouter.post("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Add the homeowner role to continue", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }
  const parsed = createProjectRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please check the project brief", code: "INVALID_PROJECT" } }, 400);
  const input = parsed.data;

  const assets = input.media.length
    ? await prisma.asset.findMany({
        where: { id: { in: input.media.map((item) => item.assetId) }, userId: user.id },
      })
    : [];
  if (assets.length !== input.media.length) {
    return c.json({ error: { message: "One or more photos could not be used", code: "INVALID_MEDIA" } }, 400);
  }
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        homeownerId: user.id,
        title: input.brief.title,
        category: input.brief.category,
        status: input.publish ? "PUBLISHED" : "DRAFT",
        initialRequest: input.initialRequest,
        locationLabel: input.brief.location,
        briefJson: input.brief as Prisma.InputJsonValue,
        publishedAt: input.publish ? new Date() : null,
        media: {
          create: input.media.map((item, sortOrder) => ({
            url: assetById.get(item.assetId)!.url,
            caption: item.caption,
            sortOrder,
          })),
        },
      },
    });

    await tx.projectIntake.create({
      data: {
        userId: user.id,
        projectId: created.id,
        initialRequest: input.initialRequest,
        category: input.brief.category,
        status: "COMPLETED",
        answers: {
          create: input.turns.map((turn, position) => ({
            questionId: turn.question.id,
            questionJson: turn.question as Prisma.InputJsonValue,
            answerJson: turn.answer as Prisma.InputJsonValue,
            position,
          })),
        },
      },
    });

    return created;
  });

  return c.json({ data: project }, 201);
});

export { projectsRouter };
