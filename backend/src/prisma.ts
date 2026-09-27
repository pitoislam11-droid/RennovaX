import { PrismaClient } from "@prisma/client";

// The Vibecode backend process hot-reloads after schema generation. Creating the
// client with the module keeps its delegates aligned with the generated schema.
export const prisma = new PrismaClient();
