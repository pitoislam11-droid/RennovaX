import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { askRequestSchema, briefFromJson, getAskRennovaHelp } from "../lib/ask-rennova";
import { prisma } from "../prisma";

const askRouter = new Hono<{ Variables: AppVariables }>();

askRouter.post("/help", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "CONTRACTOR"))) {
    return c.json({ error: { message: "Ask Rennova is available on contractor accounts", code: "CONTRACTOR_ROLE_REQUIRED" } }, 403);
  }

  const parsed = askRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: { message: "Tell Ask Rennova what you need help with", code: "INVALID_ASK" } }, 400);
  }

  let brief = parsed.data.brief;
  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, status: { in: ["PUBLISHED", "AWARDED"] } },
    });
    if (project) brief = briefFromJson(project.briefJson) ?? brief;
  }

  const result = await getAskRennovaHelp(parsed.data.prompt, brief);
  if (result.source === "fallback") console.warn("Serving Ask Rennova fallback");
  return c.json({ data: result.data });
});

export { askRouter };
