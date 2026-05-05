import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function resolveSqlServerTarget(serverRaw: string) {
  if (!serverRaw.includes("\\")) {
    return {
      server: serverRaw,
      instanceName: undefined as string | undefined,
    };
  }

  const [server, instanceName] = serverRaw.split("\\", 2);

  return {
    server: server.trim(),
    instanceName: instanceName?.trim() || undefined,
  };
}

async function main() {
  const serverRaw = required("DB_SERVER");
  const database = required("DB_DATABASE");
  const user = required("DB_USERNAME");
  const password = required("DB_PASSWORD");
  const trustCert = /^(true|yes|1)$/i.test((process.env.DB_TRUST_CERT ?? "yes").trim());
  const portRaw = process.env.DB_PORT?.trim();

  const { server, instanceName } = resolveSqlServerTarget(serverRaw);
  const port = portRaw ? Number(portRaw) : undefined;

  if (portRaw && (!Number.isInteger(port) || port <= 0 || port > 65535)) {
    throw new Error("Invalid DB_PORT. Expected integer between 1 and 65535.");
  }

  const config: sql.config = {
    user,
    password,
    server,
    database,
    pool: {
      max: 3,
      min: 0,
      idleTimeoutMillis: 5000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: trustCert,
      ...(instanceName ? { instanceName } : {}),
    },
    ...(port ? { port } : {}),
  };

  console.log(
    `[db-test] connecting server=${server} database=${database}` +
      `${instanceName ? ` instance=${instanceName}` : ""}` +
      `${port ? ` port=${port}` : ""}`,
  );

  const pool = await sql.connect(config);
  const result = await pool
    .request()
    .query("SELECT @@SERVERNAME AS serverName, DB_NAME() AS databaseName, GETDATE() AS nowAtServer");

  console.log("[db-test] connection successful");
  console.table(result.recordset);

  await pool.close();
}

main().catch((error) => {
  console.error("[db-test] connection failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
