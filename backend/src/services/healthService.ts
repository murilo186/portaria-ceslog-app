import { env } from "../config/env";
import { getMssqlPool } from "../lib/mssql";
import { prisma } from "../lib/prisma";

export async function checkHealthService() {
  const dbStartedAt = process.hrtime.bigint();

  if (env.DB_CLIENT === "mssql") {
    const pool = await getMssqlPool();
    await pool.request().query("SELECT 1");
  } else {
    await prisma.$queryRaw`SELECT 1`;
  }

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
