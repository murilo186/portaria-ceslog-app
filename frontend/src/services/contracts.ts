import { z } from "zod";

const isoStringSchema = z.string().min(1);
const nullableIsoStringSchema = isoStringSchema.nullable();

export const perfilUsuarioSchema = z.enum(["ADMIN", "OPERADOR"]);
export const turnoUsuarioSchema = z.enum(["MANHA", "TARDE"]);
export const relatorioStatusSchema = z.enum(["ABERTO", "FECHADO"]);
export const perfilPessoaSchema = z.enum([
  "VISITANTE",
  "FORNECEDOR",
  "PRESTADOR",
  "PARCEIRO",
  "COLABORADOR",
  "AGREGADO",
]);

export const usuarioSchema = z.object({
  id: z.number().int(),
  nome: z.string().min(1),
  usuario: z.string().min(1).nullable(),
  email: z.string().email().nullable(),
  perfil: perfilUsuarioSchema,
  turno: turnoUsuarioSchema.nullable(),
});

export const usuarioAdminListItemSchema = usuarioSchema.extend({
  ativo: z.boolean(),
  criadoEm: isoStringSchema,
});

export const relatorioItemSchema = z.object({
  id: z.number().int(),
  relatorioId: z.number().int(),
  usuarioId: z.number().int(),
  perfilPessoa: perfilPessoaSchema,
  empresa: z.string().min(1),
  placaVeiculo: z.string().min(1),
  nome: z.string().min(1),
  horaEntrada: z.string().min(1).nullable(),
  horaSaida: z.string().min(1).nullable(),
  observacoes: z.string().nullable(),
  turno: z.string().nullable(),
  criadoEm: isoStringSchema,
  usuario: usuarioSchema.optional(),
});

export const relatorioSchema = z.object({
  id: z.number().int(),
  dataRelatorio: isoStringSchema,
  status: relatorioStatusSchema,
  criadoEm: isoStringSchema,
  finalizadoEm: nullableIsoStringSchema,
  itens: z.array(relatorioItemSchema),
});

export const relatorioResumoSchema = z.object({
  id: z.number().int(),
  dataRelatorio: isoStringSchema,
  status: relatorioStatusSchema,
  criadoEm: isoStringSchema,
  finalizadoEm: nullableIsoStringSchema,
  _count: z
    .object({
      itens: z.number().int(),
    })
    .optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export const paginatedRelatorioResumoResponseSchema = z.object({
  data: z.array(relatorioResumoSchema),
  meta: paginationMetaSchema,
});

export const relatorioClockSnapshotSchema = z.object({
  nowIso: isoStringSchema,
  businessDateKey: z.string().min(1),
  msToMidnight: z.number().int(),
  minutesToMidnight: z.number().int(),
  showCountdown: z.boolean(),
  simulationEnabled: z.boolean(),
  simulationStart: z.string().nullable(),
});

export const auditLogItemSchema = z.object({
  id: z.number().int(),
  usuarioId: z.number().int().nullable(),
  usuarioNome: z.string().nullable(),
  usuarioLogin: z.string().nullable(),
  acao: z.string().min(1),
  entidade: z.string().min(1),
  entidadeId: z.number().int().nullable(),
  descricao: z.string().min(1),
  detalhes: z.record(z.string(), z.unknown()).nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  requestId: z.string().nullable(),
  criadoEm: isoStringSchema,
  usuario: z
    .object({
      id: z.number().int(),
      nome: z.string().min(1),
      usuario: z.string().nullable(),
      perfil: perfilUsuarioSchema,
    })
    .nullable(),
});

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  usuario: usuarioSchema,
});

export const okResponseSchema = z.object({
  ok: z.literal(true),
});
