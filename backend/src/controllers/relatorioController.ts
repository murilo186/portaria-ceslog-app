import { AppError } from "../middlewares/errorMiddleware";
import {
  closeRelatorioService,
  createRelatorioItemService,
  deleteRelatorioItemService,
  getReportByIdService,
  getTodayReportService,
  listReportsService,
  updateRelatorioItemService,
} from "../services/relatorioService";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const relatorioItemSchema = z.object({
  empresa: z.string().min(1),
  placaVeiculo: z.string().min(1),
  nome: z.string().min(1),
  horaEntrada: z.string().optional(),
  horaSaida: z.string().optional(),
  observacoes: z.string().optional(),
});

const relatorioIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
});

const relatorioItemIdSchema = z.object({
  relatorioId: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
});

function ensureUser(req: Request) {
  if (!req.user) {
    throw new AppError("Nao autenticado", 401);
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

export async function listReportsController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const reports = await listReportsService();
    return res.status(200).json(reports);
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
