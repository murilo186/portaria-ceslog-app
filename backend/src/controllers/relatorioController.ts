import { AppError } from "../middlewares/errorMiddleware";
import {
  closeRelatorioService,
  createNewReportService,
  createRelatorioItemService,
  deleteRelatorioItemService,
  getOpenReportService,
  getReportByIdService,
  getTodayReportService,
  listClosedReportsService,
  listReportsService,
  updateRelatorioItemService,
} from "../services/relatorioService";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const placaRegex = /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/;

const optionalTimeSchema = z
  .string()
  .trim()
  .regex(timeRegex, "Horário deve estar no formato HH:mm")
  .or(z.literal(""))
  .optional();

const relatorioItemSchema = z.object({
  empresa: z.string().trim().min(1, "Empresa é obrigatória"),
  placaVeiculo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(placaRegex, "Placa inválida. Use formato ABC1D23 ou ABC-1234"),
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  horaEntrada: optionalTimeSchema,
  horaSaida: optionalTimeSchema,
  observacoes: z.string().trim().max(500, "Observações devem ter até 500 caracteres").optional(),
});

const relatorioIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
});

const relatorioItemIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

const closedReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD")
    .optional(),
  busca: z.string().trim().max(100).optional(),
});

function ensureUser(req: Request) {
  if (!req.user) {
    throw new AppError("Não autenticado", 401, "AUTH_REQUIRED");
  }

  return req.user;
}

export async function getTodayReportController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const report = await getTodayReportService();
    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function getOpenReportController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const report = await getOpenReportService();

    if (!report) {
      return res.status(404).json({
        message: "Não existe relatório em aberto.",
        code: "OPEN_REPORT_NOT_FOUND",
      });
    }

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function createNewReportController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const report = await createNewReportService();
    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function listReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const reports = await listReportsService();
    return res.status(200).json(reports);
  } catch (error) {
    return next(error);
  }
}

export async function listClosedReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const query = closedReportsQuerySchema.parse(req.query);
    const result = await listClosedReportsService(query);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getReportByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const { relatorioId } = relatorioIdSchema.parse(req.params);
    const report = await getReportByIdService(relatorioId);

    return res.status(200).json(report);
  } catch (error) {
    return next(error);
  }
}

export async function createRelatorioItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = ensureUser(req);
    const { relatorioId } = relatorioIdSchema.parse(req.params);
    const payload = relatorioItemSchema.parse(req.body);

    const item = await createRelatorioItemService(relatorioId, payload, user);

    return res.status(201).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function updateRelatorioItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = ensureUser(req);
    const { relatorioId, itemId } = relatorioItemIdSchema.parse(req.params);
    const payload = relatorioItemSchema.parse(req.body);

    const item = await updateRelatorioItemService(relatorioId, itemId, payload, user);

    return res.status(200).json(item);
  } catch (error) {
    return next(error);
  }
}

export async function deleteRelatorioItemController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = ensureUser(req);
    const { relatorioId, itemId } = relatorioItemIdSchema.parse(req.params);

    const result = await deleteRelatorioItemService(relatorioId, itemId, user);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function closeRelatorioController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const { relatorioId } = relatorioIdSchema.parse(req.params);

    const relatorio = await closeRelatorioService(relatorioId);

    return res.status(200).json(relatorio);
  } catch (error) {
    return next(error);
  }
}

