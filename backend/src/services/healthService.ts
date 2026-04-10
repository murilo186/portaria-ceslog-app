import { prisma } from "../lib/prisma";

export async function checkHealthService() {
  const dbStartedAt = process.hrtime.bigint();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatencyMs = Number((Number(process.hrtime.bigint() - dbStartedAt) / 1_000_000).toFixed(2));

  return {
    ok: true,
    app: "up" as const,
    database: "up" as const,
    dbLatencyMs,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}
