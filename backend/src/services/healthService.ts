import { prisma } from "../lib/prisma";

export async function checkHealthService() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    ok: true,
    database: "up" as const,
    timestamp: new Date().toISOString(),
  };
}

