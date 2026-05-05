import { env } from "../config/env";
import { getMssqlPool } from "../lib/mssql";
import { prisma } from "../lib/prisma";
import { sanitizeText, toUpperWithoutAccents } from "../utils/sanitize";

export type AuditRequestContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type AuditDetails = Record<string, unknown>;

export type CreateAuditLogInput = {
  tenantId: number;
  usuarioId?: number | null;
  usuarioNome?: string | null;
  usuarioLogin?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: number | null;
  descricao: string;
  detalhes?: AuditDetails | null;
  contexto?: AuditRequestContext;
};

function serializeAuditDetails(detalhes?: AuditDetails | null): string | null {
  if (!detalhes) {
    return null;
  }

  try {
    return JSON.stringify(detalhes);
  } catch {
    return null;
  }
}

function normalizeAuditDetails(value: unknown): unknown {
  if (typeof value === "string") {
    return toUpperWithoutAccents(value.trim());
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeAuditDetails(entry));
  }

  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      result[key] = normalizeAuditDetails(nestedValue);
    }

    return result;
  }

  return value;
}

function parseAuditDetails(detalhes: string | null): AuditDetails | null {
  if (!detalhes) {
    return null;
  }

  try {
    const parsed = JSON.parse(detalhes) as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AuditDetails;
    }

    return { valor: parsed };
  } catch {
    return { bruto: detalhes };
  }
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    const usuarioNome = input.usuarioNome ? sanitizeText(input.usuarioNome) : null;
    const usuarioLogin = input.usuarioLogin ? sanitizeText(input.usuarioLogin) : null;
    const acao = sanitizeText(input.acao);
    const entidade = sanitizeText(input.entidade);
    const descricao = sanitizeText(input.descricao);
    const detalhes = serializeAuditDetails(input.detalhes ? (normalizeAuditDetails(input.detalhes) as AuditDetails) : null);

    if (env.DB_CLIENT === "mssql") {
      const pool = await getMssqlPool();
      await pool
        .request()
        .input("tenantId", input.tenantId)
        .input("usuarioId", input.usuarioId ?? null)
        .input("usuarioNome", usuarioNome)
        .input("usuarioLogin", usuarioLogin)
        .input("acao", acao)
        .input("entidade", entidade)
        .input("entidadeId", input.entidadeId ?? null)
        .input("descricao", descricao)
        .input("detalhes", detalhes)
        .input("ip", input.contexto?.ip ?? null)
        .input("userAgent", input.contexto?.userAgent ?? null)
        .input("requestId", input.contexto?.requestId ?? null)
        .query(`
          INSERT INTO portaria.portaria_audit_logs
          (
            tenantId, usuario_id, usuario_nome, usuario_login, acao, entidade,
            entidade_id, descricao, detalhes, ip, user_agent, request_id, criado_em
          )
          VALUES
          (
            @tenantId, @usuarioId, @usuarioNome, @usuarioLogin, @acao, @entidade,
            @entidadeId, @descricao, @detalhes, @ip, @userAgent, @requestId, SYSUTCDATETIME()
          )
        `);
      return;
    }

    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        usuarioId: input.usuarioId ?? null,
        usuarioNome,
        usuarioLogin,
        acao,
        entidade,
        entidadeId: input.entidadeId ?? null,
        descricao,
        detalhes,
        ip: input.contexto?.ip ?? null,
        userAgent: input.contexto?.userAgent ?? null,
        requestId: input.contexto?.requestId ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to persist audit log", error);
  }
}

export async function listAuditLogsService(limit: number, tenantId: number) {
  if (env.DB_CLIENT === "mssql") {
    const pool = await getMssqlPool();
    const logs = await pool.request().input("tenantId", tenantId).input("limit", limit).query<{
      id: number;
      usuarioId: number | null;
      usuarioNome: string | null;
      usuarioLogin: string | null;
      acao: string;
      entidade: string;
      entidadeId: number | null;
      descricao: string;
      detalhes: string | null;
      ip: string | null;
      userAgent: string | null;
      requestId: string | null;
      criadoEm: Date;
      usuario_id: number | null;
      usuario_nome: string | null;
      usuario_usuario: string | null;
      usuario_perfil: string | null;
    }>(`
      SELECT TOP (@limit)
        l.id,
        l.usuario_id AS usuarioId,
        l.usuario_nome AS usuarioNome,
        l.usuario_login AS usuarioLogin,
        l.acao,
        l.entidade,
        l.entidade_id AS entidadeId,
        l.descricao,
        l.detalhes,
        l.ip,
        l.user_agent AS userAgent,
        l.request_id AS requestId,
        l.criado_em AS criadoEm,
        u.id AS usuario_id,
        u.nome AS usuario_nome,
        u.usuario AS usuario_usuario,
        u.perfil AS usuario_perfil
      FROM portaria.portaria_audit_logs l
      LEFT JOIN portaria.portaria_usuarios u ON u.id = l.usuario_id
      WHERE l.tenantId = @tenantId
      ORDER BY l.criado_em DESC
    `);

    return logs.recordset.map((log) => ({
      id: log.id,
      usuarioId: log.usuarioId,
      usuarioNome: log.usuarioNome,
      usuarioLogin: log.usuarioLogin,
      acao: log.acao,
      entidade: log.entidade,
      entidadeId: log.entidadeId,
      descricao: log.descricao,
      detalhes: parseAuditDetails(log.detalhes),
      ip: log.ip,
      userAgent: log.userAgent,
      requestId: log.requestId,
      criadoEm: log.criadoEm,
      usuario: log.usuario_id
        ? {
            id: log.usuario_id,
            nome: log.usuario_nome ?? "",
            usuario: log.usuario_usuario,
            perfil: log.usuario_perfil,
          }
        : null,
    }));
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId,
    },
    take: limit,
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      usuario: {
        select: {
          id: true,
          nome: true,
          usuario: true,
          perfil: true,
        },
      },
    },
  });

  return logs.map((log) => ({
    ...log,
    detalhes: parseAuditDetails(log.detalhes),
  }));
}
