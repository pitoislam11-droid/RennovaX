import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { prisma } from "../prisma";
import { submitQuoteSchema } from "../types";

const quotesRouter = new Hono<{ Variables: AppVariables }>();

function totalPence(parts: { labourPence: number; materialsPence: number; wastePence: number; otherPence: number }) {
  return parts.labourPence + parts.materialsPence + parts.wastePence + parts.otherPence;
}

quotesRouter.get("/project/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Homeowner access required", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const project = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), homeownerId: user.id },
  });
  if (!project) return c.json({ error: { message: "Project not found", code: "PROJECT_NOT_FOUND" } }, 404);

  const quotes = await prisma.quote.findMany({
    where: { projectId: project.id, status: { in: ["SUBMITTED", "ACCEPTED"] } },
    orderBy: { submittedAt: "asc" },
    include: {
      contractorProfile: {
        select: {
          id: true,
          businessName: true,
          accountKind: true,
          about: true,
          serviceArea: true,
          logoUrl: true,
          servicesJson: true,
          verification: true,
          portfolioProjects: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
          },
        },
      },
    },
  });

  return c.json({
    data: quotes.map((quote) => ({
      ...quote,
      totalPence: totalPence(quote),
      isSelected: project.selectedQuoteId === quote.id,
    })),
  });
});

quotesRouter.post("/project/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "CONTRACTOR"))) {
    return c.json({ error: { message: "Contractor access required", code: "CONTRACTOR_ROLE_REQUIRED" } }, 403);
  }
  const profile = await prisma.contractorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Finish your business profile first", code: "PROFILE_REQUIRED" } }, 400);

  const project = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), status: "PUBLISHED" },
  });
  if (!project) return c.json({ error: { message: "Opportunity not found", code: "NOT_FOUND" } }, 404);
  if (project.selectedQuoteId) {
    return c.json({ error: { message: "This project already has a selected contractor", code: "PROJECT_CLOSED" } }, 409);
  }

  const parsed = submitQuoteSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please check your quotation details", code: "INVALID_QUOTE" } }, 400);
  const input = parsed.data;

  const quote = await prisma.quote.upsert({
    where: {
      projectId_contractorProfileId: {
        projectId: project.id,
        contractorProfileId: profile.id,
      },
    },
    create: {
      projectId: project.id,
      contractorProfileId: profile.id,
      status: "SUBMITTED",
      labourPence: input.labourPence,
      materialsPence: input.materialsPence,
      wastePence: input.wastePence,
      otherPence: input.otherPence,
      durationText: input.durationText ?? null,
      materialsIncluded: input.materialsIncluded,
      warrantyText: input.warrantyText ?? null,
      scopeText: input.scopeText ?? null,
      assumptionsText: input.assumptionsText ?? null,
      exclusionsText: input.exclusionsText ?? null,
      submittedAt: new Date(),
    },
    update: {
      status: "SUBMITTED",
      labourPence: input.labourPence,
      materialsPence: input.materialsPence,
      wastePence: input.wastePence,
      otherPence: input.otherPence,
      durationText: input.durationText ?? null,
      materialsIncluded: input.materialsIncluded,
      warrantyText: input.warrantyText ?? null,
      scopeText: input.scopeText ?? null,
      assumptionsText: input.assumptionsText ?? null,
      exclusionsText: input.exclusionsText ?? null,
      submittedAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: project.homeownerId,
      type: "QUOTE_RECEIVED",
      title: "New private quotation",
      body: `${profile.businessName} sent a quote for ${project.title}.`,
      dataJson: { projectId: project.id, quoteId: quote.id },
    },
  });

  return c.json({ data: { ...quote, totalPence: totalPence(quote) } }, 201);
});

quotesRouter.post("/:quoteId/accept", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Homeowner access required", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const quote = await prisma.quote.findUnique({
    where: { id: c.req.param("quoteId") },
    include: { project: true, contractorProfile: true },
  });
  if (!quote || quote.project.homeownerId !== user.id) {
    return c.json({ error: { message: "Quote not found", code: "NOT_FOUND" } }, 404);
  }
  if (quote.status !== "SUBMITTED") {
    return c.json({ error: { message: "Only submitted quotes can be accepted", code: "INVALID_STATUS" } }, 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: { projectId: quote.projectId, status: "SUBMITTED", id: { not: quote.id } },
      data: { status: "DECLINED" },
    });
    await tx.quote.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED" },
    });
    await tx.project.update({
      where: { id: quote.projectId },
      data: { selectedQuoteId: quote.id, status: "AWARDED" },
    });
    await tx.notification.create({
      data: {
        userId: quote.contractorProfile.userId,
        type: "QUOTE_ACCEPTED",
        title: "You’ve been selected",
        body: `A homeowner chose ${quote.contractorProfile.businessName} for ${quote.project.title}.`,
        dataJson: { projectId: quote.projectId, quoteId: quote.id },
      },
    });
  });

  const updated = await prisma.quote.findUniqueOrThrow({
    where: { id: quote.id },
    include: { contractorProfile: true },
  });
  return c.json({ data: { ...updated, totalPence: totalPence(updated), isSelected: true } });
});

export { quotesRouter };
