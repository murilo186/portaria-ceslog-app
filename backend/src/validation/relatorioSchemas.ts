import { z } from "zod";
import { hhmmTimeSchema, isoDateOnlySchema, optionalTimeSchema, placaVeiculoSchema, positiveIntSchema } from "./commonSchemas";

const perfilPessoaValues = [
  "VISITANTE",
  "FORNECEDOR",
  "PRESTADOR",
  "PARCEIRO",
  "COLABORADOR",
  "AGREGADO",
] as const;

export const relatorioItemSchema = z.object({
  perfilPessoa: z.enum(perfilPessoaValues),
  empresa: z.string().trim().min(1, "Empresa e obrigatoria"),
  placaVeiculo: placaVeiculoSchema,
  nome: z.string().trim().min(1, "Nome e obrigatorio"),
  horaEntrada: optionalTimeSchema,
  horaSaida: optionalTimeSchema,
  observacoes: z.string().trim().max(500, "Observacoes devem ter ate 500 caracteres").optional(),
});

export const relatorioIdSchema = z.object({
  relatorioId: positiveIntSchema,
});

export const relatorioItemIdSchema = z.object({
  relatorioId: positiveIntSchema,
  itemId: positiveIntSchema,
});

export const closedReportsQuerySchema = z.object({
  page: positiveIntSchema.default(1),
  pageSize: positiveIntSchema.max(50).default(10),
  data: isoDateOnlySchema.optional(),
  busca: z.string().trim().max(100).optional(),
});

export const reportItemsCursorQuerySchema = z.object({
  itemCursor: positiveIntSchema.optional(),
  itemLimit: positiveIntSchema.max(100).optional(),
});

export const relatorioClockSimulationSchema = z.object({
  start: hhmmTimeSchema.nullable().optional(),
});
