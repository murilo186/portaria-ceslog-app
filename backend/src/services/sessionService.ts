import { env } from "../config/env";
import { getMssqlPool } from "../lib/mssql";
import { prisma } from "../lib/prisma";
import { randomUUID } from "node:crypto";

export async function createOrReplaceUserSession(usuarioId: number): Promise<string> {
  const sessionId = randomUUID();

  if (env.DB_CLIENT === "mssql") {
    const pool = await getMssqlPool();
    await pool
      .request()
      .input("usuarioId", usuarioId)
      .input("sessionId", sessionId)
      .query(`
        MERGE portaria.portaria_auth_sessions AS target
        USING (SELECT @usuarioId AS usuario_id, @sessionId AS session_id) AS source
        ON target.usuario_id = source.usuario_id
        WHEN MATCHED THEN
          UPDATE SET session_id = source.session_id, atualizado_em = SYSUTCDATETIME()
        WHEN NOT MATCHED THEN
          INSERT (usuario_id, session_id, atualizado_em)
          VALUES (source.usuario_id, source.session_id, SYSUTCDATETIME());
      `);

    return sessionId;
  }

  await prisma.authSession.upsert({
    where: {
      usuarioId,
    },
    update: {
      sessionId,
      atualizadoEm: new Date(),
    },
    create: {
      usuarioId,
      sessionId,
    },
  });

  return sessionId;
}

export async function getActiveSessionId(usuarioId: number): Promise<string | null> {
  if (env.DB_CLIENT === "mssql") {
    const pool = await getMssqlPool();
    const result = await pool.request().input("usuarioId", usuarioId).query<{ session_id: string }>(`
        SELECT TOP 1 session_id
        FROM portaria.portaria_auth_sessions
        WHERE usuario_id = @usuarioId
      `);

    return result.recordset[0]?.session_id ?? null;
  }

  const session = await prisma.authSession.findUnique({
    where: {
      usuarioId,
    },
    select: {
      sessionId: true,
    },
  });

  return session?.sessionId ?? null;
}
