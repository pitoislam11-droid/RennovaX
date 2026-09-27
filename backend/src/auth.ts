import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { env } from "./env";
import { prisma } from "./prisma";

async function sendPasswordResetCode(email: string, code: string) {
  const response = await fetch("https://smtp.vibecodeapp.com/v1/send/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(env.VIBECODE_PROJECT_TOKEN
        ? { "X-Vibecode-Project-Token": env.VIBECODE_PROJECT_TOKEN }
        : {}),
    },
    body: JSON.stringify({
      to: email,
      code,
      fromName: "Rennova",
      lang: "en",
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Unable to send reset code (${response.status})`);
  }
}

const databaseProvider = env.DATABASE_URL.startsWith("postgres") ? "postgresql" : "sqlite";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: databaseProvider }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    "rennova://*/*",
    "vibecode://*/*",
    "exp://*/*",
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.trycloudflare.com",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],
  plugins: [
    expo(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        if (type === "forget-password") {
          await sendPasswordResetCode(email, String(otp));
        }
      },
    }),
  ],
  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
