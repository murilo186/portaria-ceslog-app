import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

function parseBooleanLike(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  return /^(true|yes|1)$/i.test(value.trim());
}

function buildDatabaseUrl(): string {
  const explicit = process.env.DATABASE_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const server = process.env.DB_SERVER?.trim();
  const explicitInstance = process.env.DB_INSTANCE?.trim();
  const database = process.env.DB_DATABASE?.trim();
  const username = process.env.DB_USERNAME?.trim();
  const password = process.env.DB_PASSWORD ?? "";

  if (!server || !database || !username || !password) {
    throw new Error("Missing DB_* env vars to build DATABASE_URL");
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

function maskUrl(url: string): string {
  return url.replace(/password=[^;]+/i, "password=***");
}

async function main() {
  const url = buildDatabaseUrl();
  process.env.DATABASE_URL = url;
  console.log("[prisma-test] url =", maskUrl(url));

  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("[prisma-test] connection successful");
  } catch (error) {
    console.error("[prisma-test] connection failed");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
