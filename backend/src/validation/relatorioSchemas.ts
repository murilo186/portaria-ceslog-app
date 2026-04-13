import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const placaRegex = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;

const perfilPessoaValues = [
  "VISITANTE",
  "FORNECEDOR",
  "PRESTADOR",
  "PARCEIRO",
  "COLABORADOR",
  "AGREGADO",
] as const;

const optionalTimeSchema = z
  .string()
  .trim()
  .regex(timeRegex, "Horario deve estar no formato HH:mm")
  .or(z.literal(""))
  .optional();

export const relatorioItemSchema = z.object({
  perfilPessoa: z.enum(perfilPessoaValues),
  empresa: z.string().trim().min(1, "Empresa e obrigatoria"),
  placaVeiculo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(placaRegex, "Placa invalida. Use formato ABC1D23 ou ABC-1234"),
  nome: z.string().trim().min(1, "Nome e obrigatorio"),
  horaEntrada: optionalTimeSchema,
  horaSaida: optionalTimeSchema,
  observacoes: z.string().trim().max(500, "Observacoes devem ter ate 500 caracteres").optional(),
});

export const relatorioIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
});

export const relatorioItemIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

export const closedReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
    .optional(),
  busca: z.string().trim().max(100).optional(),
});

export const relatorioClockSimulationSchema = z.object({
  start: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horario invalido. Use HH:mm.")
    .nullable()
    .optional(),
});
