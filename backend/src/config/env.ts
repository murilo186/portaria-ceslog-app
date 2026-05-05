import dotenv from "dotenv";

dotenv.config();

type Env = {
  PORT: number;
  DB_CLIENT: "prisma" | "mssql";
  DB_SERVER: string;
  DB_PORT: number | null;
  DB_INSTANCE: string | null;
  DB_DATABASE: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_TRUST_CERT: boolean;
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLOCK_SIMULATION_START: string | null;
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function parseBooleanLike(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  return /^(true|yes|1)$/i.test(value.trim());
}

function buildSqlServerUrlFromDiscreteEnv(): string | null {
  const server = process.env.DB_SERVER?.trim();
  const explicitInstance = process.env.DB_INSTANCE?.trim();
  const database = process.env.DB_DATABASE?.trim();
  const username = process.env.DB_USERNAME?.trim();
  const password = process.env.DB_PASSWORD ?? "";

  if (!server || !database || !username || !password) {
    return null;
  }

  const rawPort = process.env.DB_PORT?.trim();
  const hasNamedInstance = server.includes("\\");
  const [hostPart, instancePart] = hasNamedInstance ? server.split("\\", 2) : [server, ""];
  const host = hostPart.trim();
  const instance = explicitInstance || instancePart.trim();

  const hostWithPort = rawPort ? `${host}:${rawPort}` : host;
  const trustServerCertificate = parseBooleanLike(process.env.DB_TRUST_CERT, true) ? "true" : "false";

  const encodedDb = encodeURIComponent(database);
  const encodedUser = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);
  const instanceSegment = instance ? `;instance=${encodeURIComponent(instance)}` : "";

  return `sqlserver://${hostWithPort};database=${encodedDb};user=${encodedUser};password=${encodedPassword}${instanceSegment};encrypt=true;trustServerCertificate=${trustServerCertificate}`;
}

function resolveDatabaseUrl(): string {
  const explicit = process.env.DATABASE_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const built = buildSqlServerUrlFromDiscreteEnv();

  if (!built) {
    throw new Error(
      "Missing required env var: DATABASE_URL (or set DB_SERVER, DB_DATABASE, DB_USERNAME, DB_PASSWORD)",
    );
  }

  process.env.DATABASE_URL = built;
  return built;
}

function resolveDbClient(): "prisma" | "mssql" {
  const raw = (process.env.DB_CLIENT ?? "prisma").trim().toLowerCase();

  if (raw === "prisma" || raw === "mssql") {
    return raw;
  }

  throw new Error("Invalid DB_CLIENT. Use 'prisma' or 'mssql'.");
}

function parseOptionalPort(value: string | undefined): number | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Invalid DB_PORT. Use an integer between 1 and 65535.");
  }

  return parsed;
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 3000),
  DB_CLIENT: resolveDbClient(),
  DB_SERVER: process.env.DB_SERVER?.trim() ?? "",
  DB_PORT: parseOptionalPort(process.env.DB_PORT),
  DB_INSTANCE: process.env.DB_INSTANCE?.trim() || null,
  DB_DATABASE: process.env.DB_DATABASE?.trim() ?? "",
  DB_USERNAME: process.env.DB_USERNAME?.trim() ?? "",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "",
  DB_TRUST_CERT: parseBooleanLike(process.env.DB_TRUST_CERT, true),
  DATABASE_URL: resolveDatabaseUrl(),
  JWT_SECRET: required("JWT_SECRET"),
  CLOCK_SIMULATION_START: process.env.CLOCK_SIMULATION_START ?? null,
};
