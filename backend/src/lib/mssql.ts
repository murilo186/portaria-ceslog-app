import { env } from "../config/env";
import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function buildSqlConfig(): sql.config {
  const serverRaw = env.DB_SERVER;
  const [hostPart, instancePart] = serverRaw.includes("\\") ? serverRaw.split("\\", 2) : [serverRaw, ""];
  const instanceName = env.DB_INSTANCE ?? (instancePart.trim() || undefined);

  return {
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    server: hostPart.trim(),
    database: env.DB_DATABASE,
    ...(env.DB_PORT ? { port: env.DB_PORT } : {}),
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 5000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: env.DB_TRUST_CERT,
      ...(instanceName ? { instanceName } : {}),
    },
  };
}

export function getMssqlPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const config = buildSqlConfig();
    poolPromise = sql.connect(config);
  }

  return poolPromise as Promise<sql.ConnectionPool>;
}

export { sql };
