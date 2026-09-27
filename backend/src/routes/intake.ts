import { Hono } from "hono";
import type { AppVariables } from "../lib/auth-context";
import { requireUser, userHasRole } from "../lib/auth-context";
import { getNextIntakeStep } from "../lib/intake-ai";
import { nextIntakeRequestSchema } from "../types";

const intakeRouter = new Hono<{ Variables: AppVariables }>();

intakeRouter.post("/next", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);
  if (!(await userHasRole(user.id, "HOMEOWNER"))) {
    return c.json({ error: { message: "Add the homeowner role to continue", code: "HOMEOWNER_ROLE_REQUIRED" } }, 403);
  }

  const parsed = nextIntakeRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Please check the project details", code: "INVALID_REQUEST" } }, 400);
  const result = await getNextIntakeStep(parsed.data);
  if (result.source === "fallback") console.warn("Serving validated fallback intake step");
  return c.json({ data: result.step });
});

export { intakeRouter };
