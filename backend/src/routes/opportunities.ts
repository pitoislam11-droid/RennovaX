import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { prisma } from "../prisma";

const opportunitiesRouter = new Hono<{ Variables: AppVariables }>();

async function requireContractor(userId: string) {
  if (!(await userHasRole(userId, "CONTRACTOR"))) return null;
  return prisma.contractorProfile.findUnique({ where: { userId } });
}

opportunitiesRouter.get("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const profile = await requireContractor(user.id);
  if (!profile) return c.json({ error: { message: "Finish your contractor profile first", code: "PROFILE_REQUIRED" } }, 403);

  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 5 },
      quotes: {
        where: { contractorProfileId: profile.id },
        select: { id: true, status: true, submittedAt: true },
      },
      _count: { select: { media: true } },
    },
  });

  const data = projects.map((project) => ({
    id: project.id,
    title: project.title,
    category: project.category,
    locationLabel: project.locationLabel,
    publishedAt: project.publishedAt,
    mediaCount: project._count.media,
    previewMedia: project.media,
    briefPreview: {
      timing: (project.briefJson as { timing?: string } | null)?.timing ?? null,
      materials: (project.briefJson as { materials?: string } | null)?.materials ?? null,
      summary: (project.briefJson as { summary?: string } | null)?.summary ?? null,
    },
    myQuote: project.quotes[0] ?? null,
  }));

  return c.json({ data });
});

opportunitiesRouter.get("/stats", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const profile = await requireContractor(user.id);
  if (!profile) return c.json({ error: { message: "Finish your contractor profile first", code: "PROFILE_REQUIRED" } }, 403);

  const [newOpportunities, awaitingResponse, activeProjects] = await Promise.all([
    prisma.project.count({
      where: {
        status: "PUBLISHED",
        quotes: { none: { contractorProfileId: profile.id } },
      },
    }),
    prisma.quote.count({
      where: { contractorProfileId: profile.id, status: "SUBMITTED" },
    }),
    prisma.quote.count({
      where: { contractorProfileId: profile.id, status: "ACCEPTED" },
    }),
  ]);

  return c.json({
    data: { newOpportunities, awaitingResponse, activeProjects },
  });
});

opportunitiesRouter.get("/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  const profile = await requireContractor(user.id);
  if (!profile) return c.json({ error: { message: "Finish your contractor profile first", code: "PROFILE_REQUIRED" } }, 403);

  const project = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), status: "PUBLISHED" },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      quotes: {
        where: { contractorProfileId: profile.id },
      },
    },
  });
  if (!project) return c.json({ error: { message: "Opportunity not found", code: "NOT_FOUND" } }, 404);

  // Private quotes: never expose other contractors' quotes
  return c.json({
    data: {
      id: project.id,
      title: project.title,
      category: project.category,
      locationLabel: project.locationLabel,
      publishedAt: project.publishedAt,
      briefJson: project.briefJson,
      media: project.media,
      myQuote: project.quotes[0] ?? null,
    },
  });
});

export { opportunitiesRouter };
