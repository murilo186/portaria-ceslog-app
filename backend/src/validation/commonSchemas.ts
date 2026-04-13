import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const placaRegex = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;

export const positiveIntSchema = z.coerce.number().int().positive();

export const isoDateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD");

export const hhmmTimeSchema = z.string().trim().regex(timeRegex, "Horario deve estar no formato HH:mm");

export const optionalTimeSchema = hhmmTimeSchema.or(z.literal("")).optional();

export const placaVeiculoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(placaRegex, "Placa invalida. Use formato ABC1D23 ou ABC-1234");
