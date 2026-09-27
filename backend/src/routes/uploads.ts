import { Hono } from "hono";
import { env } from "../env";
import type { AppVariables } from "../lib/auth-context";
import { requireUser } from "../lib/auth-context";
import { prisma } from "../prisma";

const uploadsRouter = new Hono<{ Variables: AppVariables }>();

uploadsRouter.post("/", async (c) => {
  const user = requireUser(c);
  if (!user) return c.json({ error: { message: "Please sign in", code: "UNAUTHENTICATED" } }, 401);

  const formData = await c.req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return c.json({ error: { message: "Choose a photo to upload", code: "FILE_REQUIRED" } }, 400);
  }
  if (!file.type.startsWith("image/")) {
    return c.json({ error: { message: "Only image uploads are supported here", code: "INVALID_FILE_TYPE" } }, 400);
  }
  if (file.size > 15 * 1024 * 1024) {
    return c.json({ error: { message: "Please choose an image smaller than 15 MB", code: "FILE_TOO_LARGE" } }, 400);
  }

  const storageForm = new FormData();
  storageForm.append("file", file);
  const response = await fetch("https://storage.vibecodeapp.com/v1/files/upload", {
    method: "POST",
    headers: env.VIBECODE_PROJECT_TOKEN
      ? { "X-Vibecode-Project-Token": env.VIBECODE_PROJECT_TOKEN }
      : undefined,
    body: storageForm,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    return c.json({ error: { message: body?.error ?? "Photo upload failed", code: "UPLOAD_FAILED" } }, 502);
  }

  const result = await response.json() as {
    file: { id: string; url: string; originalFilename: string; contentType: string; sizeBytes: number };
  };
  const asset = await prisma.asset.create({
    data: {
      userId: user.id,
      fileId: result.file.id,
      url: result.file.url,
      filename: result.file.originalFilename,
      contentType: result.file.contentType,
      sizeBytes: result.file.sizeBytes,
    },
  });

  return c.json({ data: asset }, 201);
});

export { uploadsRouter };
