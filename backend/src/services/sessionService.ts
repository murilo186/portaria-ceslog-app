import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

type SessionRow = {
  session_id: string;
};

export async function createOrReplaceUserSession(usuarioId: number): Promise<string> {
  const sessionId = randomUUID();

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "auth_sessions" ("usuario_id", "session_id", "atualizado_em")
      VALUES (${usuarioId}, ${sessionId}, NOW())
      ON CONFLICT ("usuario_id")
      DO UPDATE
      SET "session_id" = EXCLUDED."session_id",
          "atualizado_em" = NOW()
    `,
  );

  return sessionId;
}

export async function getActiveSessionId(usuarioId: number): Promise<string | null> {
  const rows = await prisma.$queryRaw<SessionRow[]>(
    Prisma.sql`
      SELECT "session_id"
      FROM "auth_sessions"
      WHERE "usuario_id" = ${usuarioId}
      LIMIT 1
    `,
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0].session_id;
}
