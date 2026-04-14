import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditRequestContext = {
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

export type CreateAuditLogInput = {
  tenantId: number;
  usuarioId?: number | null;
  usuarioNome?: string | null;
  usuarioLogin?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: number | null;
  descricao: string;
  detalhes?: Prisma.InputJsonValue;
  contexto?: AuditRequestContext;
};

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        usuarioId: input.usuarioId ?? null,
        usuarioNome: input.usuarioNome ?? null,
        usuarioLogin: input.usuarioLogin ?? null,
        acao: input.acao,
        entidade: input.entidade,
        entidadeId: input.entidadeId ?? null,
        descricao: input.descricao,
        detalhes: input.detalhes,
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
  return prisma.auditLog.findMany({
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
}
