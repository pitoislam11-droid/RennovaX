import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { env } from "./env";
import { type AppVariables, sessionMiddleware } from "./lib/auth-context";
import { intakeRouter } from "./routes/intake";
import { profileRouter } from "./routes/profile";
import { projectsRouter } from "./routes/projects";
import { sampleRouter } from "./routes/sample";
import { uploadsRouter } from "./routes/uploads";
import { contractorsRouter } from "./routes/contractors";
import { opportunitiesRouter } from "./routes/opportunities";
import { quotesRouter } from "./routes/quotes";
import { messagesRouter } from "./routes/messages";
import { callsRouter } from "./routes/calls";
import { askRouter } from "./routes/ask";
import { notificationsRouter } from "./routes/notifications";

const app = new Hono<{ Variables: AppVariables }>();

const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
  /^exp:\/\/.*$/,
  /^rennova:\/\/.*$/,
  /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
  /^https:\/\/[a-z0-9-]+\.style\.dev$/,
  /^https:\/\/\d+-[a-z0-9-]+\.daytonaproxy01\.(net|eu)$/,
];

app.use("*", cors({
  origin: (origin) => origin && allowed.some((pattern) => pattern.test(origin)) ? origin : null,
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
}));
app.use("*", logger());

app.get("/health", (c) => c.json({ status: "ok" }));
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/sample", sampleRouter);

app.use("/api/intake/*", sessionMiddleware);
app.use("/api/profile/*", sessionMiddleware);
app.use("/api/projects/*", sessionMiddleware);
app.use("/api/uploads/*", sessionMiddleware);
app.use("/api/contractors/*", sessionMiddleware);
app.use("/api/opportunities/*", sessionMiddleware);
app.use("/api/quotes/*", sessionMiddleware);
app.use("/api/messages/*", sessionMiddleware);
app.use("/api/calls/*", sessionMiddleware);
app.use("/api/ask/*", sessionMiddleware);
app.use("/api/notifications/*", sessionMiddleware);
app.route("/api/intake", intakeRouter);
app.route("/api/profile", profileRouter);
app.route("/api/projects", projectsRouter);
app.route("/api/uploads", uploadsRouter);
app.route("/api/contractors", contractorsRouter);
app.route("/api/opportunities", opportunitiesRouter);
app.route("/api/quotes", quotesRouter);
app.route("/api/messages", messagesRouter);
app.route("/api/calls", callsRouter);
app.route("/api/ask", askRouter);
app.route("/api/notifications", notificationsRouter);

export default {
  port: Number(env.PORT),
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
