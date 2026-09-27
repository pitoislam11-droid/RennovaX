import type { Context, Next } from "hono";
import { auth } from "../auth";
import { prisma } from "../prisma";

export type AppVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export async function sessionMiddleware(c: Context<{ Variables: AppVariables }>, next: Next) {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
}

export function requireUser(c: Context<{ Variables: AppVariables }>) {
  const user = c.get("user");
  if (!user) return null;
  return user;
}

export async function userHasRole(userId: string, role: "HOMEOWNER" | "CONTRACTOR") {
  const membership = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role } },
    select: { id: true },
  });
  return Boolean(membership);
}
