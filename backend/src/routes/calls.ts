import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { prisma } from "../prisma";
import { createCallRequestSchema, respondCallRequestSchema } from "../types";

const callsRouter = new Hono<{ Variables: AppVariables }>();

callsRouter.post("/project/:projectId/request", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "CONTRACTOR"))) {
    return c.json({ error: { message: "Contractor access required", code: "CONTRACTOR_ROLE_REQUIRED" } }, 403);
  }
  const profile = await prisma.contractorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return c.json({ error: { message: "Finish your business profile first", code: "PROFILE_REQUIRED" } }, 400);

  const project = await prisma.project.findFirst({
    where: { id: c.req.param("projectId"), status: { in: ["PUBLISHED", "AWARDED"] } },
  });
  if (!project) return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);

  const hasQuote = await prisma.quote.findFirst({
    where: { projectId: project.id, contractorProfileId: profile.id, status: { in: ["SUBMITTED", "ACCEPTED"] } },
  });
  if (!hasQuote) {
    return c.json({ error: { message: "Submit a quotation before requesting a call", code: "QUOTE_REQUIRED" } }, 400);
  }

  const parsed = createCallRequestSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: { message: "Invalid call request", code: "INVALID_CALL" } }, 400);

  const callRequest = await prisma.callRequest.upsert({
    where: {
      projectId_contractorProfileId: {
        projectId: project.id,
        contractorProfileId: profile.id,
      },
    },
    create: {
      projectId: project.id,
      contractorProfileId: profile.id,
      status: "PENDING",
      note: parsed.data.note ?? null,
    },
    update: {
      status: "PENDING",
      note: parsed.data.note ?? null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: project.homeownerId,
      type: "CALL_REQUEST",
      title: "Call request",
      body: `${profile.businessName} would like to discuss your project.`,
      dataJson: { projectId: project.id, callRequestId: callRequest.id },
    },
  });

  return c.json({ data: callRequest }, 201);
});

callsRouter.get("/project/:projectId", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const project = await prisma.project.findUnique({ where: { id: c.req.param("projectId") } });
  if (!project) return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);

  const contractor = await prisma.contractorProfile.findUnique({ where: { userId: user.id } });
  const isHomeowner = project.homeownerId === user.id;
  if (!isHomeowner && !contractor) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const requests = await prisma.callRequest.findMany({
    where: {
      projectId: project.id,
      ...(isHomeowner ? {} : { contractorProfileId: contractor!.id }),
    },
    include: {
      contractorProfile: {
        select: { id: true, businessName: true, accountKind: true, logoUrl: true, verification: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: requests });
});

callsRouter.post("/:callRequestId/respond", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Only the homeowner can approve calls", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const parsed = respondCallRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Choose approve or decline", code: "INVALID_DECISION" } }, 400);

  const callRequest = await prisma.callRequest.findUnique({
    where: { id: c.req.param("callRequestId") },
    include: { project: true, contractorProfile: true },
  });
  if (!callRequest || callRequest.project.homeownerId !== user.id) {
    return c.json({ error: { message: "Call request not found", code: "NOT_FOUND" } }, 404);
  }

  const updated = await prisma.callRequest.update({
    where: { id: callRequest.id },
    data: { status: parsed.data.decision },
  });

  await prisma.notification.create({
    data: {
      userId: callRequest.contractorProfile.userId,
      type: parsed.data.decision === "APPROVED" ? "CALL_APPROVED" : "CALL_DECLINED",
      title: parsed.data.decision === "APPROVED" ? "Call approved" : "Call declined",
      body: parsed.data.decision === "APPROVED"
        ? `The homeowner approved a call about ${callRequest.project.title}.`
        : `The homeowner declined a call about ${callRequest.project.title}.`,
      dataJson: { projectId: callRequest.projectId, callRequestId: callRequest.id },
    },
  });

  return c.json({ data: updated });
});

export { callsRouter };
