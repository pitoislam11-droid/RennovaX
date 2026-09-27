import { Prisma } from "@prisma/client";
import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { prisma } from "../prisma";
import { createPortfolioSchema, upsertContractorProfileSchema } from "../types";

const contractorsRouter = new Hono<{ Variables: AppVariables }>();

async function requireContractorProfile(userId: string) {
  return prisma.contractorProfile.findUnique({ where: { userId } });
}

contractorsRouter.get("/me", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "CONTRACTOR"))) {
    return c.json({ error: { message: "Add the contractor role to continue", code: "CONTRACTOR_ROLE_REQUIRED" } }, 403);
  }
  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: user.id },
    include: {
      portfolioProjects: {
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
      _count: { select: { quotes: true } },
    },
  });
  return c.json({ data: profile });
});

contractorsRouter.put("/me", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "CONTRACTOR"))) {
    return c.json({ error: { message: "Add the contractor role to continue", code: "CONTRACTOR_ROLE_REQUIRED" } }, 403);
  }
  const parsed = upsertContractorProfileSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please check your business details", code: "INVALID_PROFILE" } }, 400);
  const input = parsed.data;

  const profile = await prisma.contractorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      accountKind: input.accountKind,
      businessName: input.businessName.trim(),
      about: input.about?.trim() || null,
      serviceArea: input.serviceArea?.trim() || null,
      logoUrl: input.logoUrl || null,
      servicesJson: input.services as Prisma.InputJsonValue,
      verification: "UNVERIFIED",
    },
    update: {
      accountKind: input.accountKind,
      businessName: input.businessName.trim(),
      about: input.about?.trim() || null,
      serviceArea: input.serviceArea?.trim() || null,
      logoUrl: input.logoUrl || null,
      servicesJson: input.services as Prisma.InputJsonValue,
    },
  });

  return c.json({ data: profile });
});

contractorsRouter.get("/directory", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const profiles = await prisma.contractorProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: 40,
    include: {
      portfolioProjects: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
      _count: { select: { portfolioProjects: true, quotes: true } },
    },
  });
  return c.json({ data: profiles });
});

contractorsRouter.get("/:profileId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const profile = await prisma.contractorProfile.findUnique({
    where: { id: c.req.param("profileId") },
    include: {
      portfolioProjects: {
        orderBy: { createdAt: "desc" },
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!profile) return c.json({ error: { message: "Contractor not found", code: "NOT_FOUND" } }, 404);
  return c.json({ data: profile });
});

contractorsRouter.post("/me/portfolio", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const profile = await requireContractorProfile(user.id);
  if (!profile) return c.json({ error: { message: "Finish your business profile first", code: "PROFILE_REQUIRED" } }, 400);

  const parsed = createPortfolioSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please check the portfolio project", code: "INVALID_PORTFOLIO" } }, 400);
  const input = parsed.data;

  const project = await prisma.portfolioProject.create({
    data: {
      contractorProfileId: profile.id,
      title: input.title.trim(),
      area: input.area?.trim() || null,
      description: input.description?.trim() || null,
      servicesJson: input.services as Prisma.InputJsonValue,
      media: {
        create: input.mediaUrls.map((url, sortOrder) => ({
          url,
          kind: sortOrder === 0 ? "COVER" : "GALLERY",
          sortOrder,
        })),
      },
    },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  return c.json({ data: project }, 201);
});

export { contractorsRouter };
