import { AppError } from "../middlewares/errorMiddleware";
import { createAuditLog } from "../services/auditService";
import {
  closeRelatorioService,
  createNewReportService,
  createRelatorioItemService,
  deleteRelatorioItemService,
  getRelatorioClockService,
  getOpenReportService,
  getReportByIdService,
  setRelatorioClockSimulationService,
  getTodayReportService,
  listClosedReportsService,
  listReportsService,
  updateRelatorioItemService,
} from "../services/relatorioService";
import { getRequestMetadata } from "../utils/requestMetadata";
import type { NextFunction, Request, Response } from "express";
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

const relatorioItemSchema = z.object({
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

const relatorioClockSimulationSchema = z.object({
  start: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horario invalido. Use HH:mm.")
    .nullable()
    .optional(),
});

function ensureUser(req: Request) {
  if (!req.user) {
    throw new AppError("Nao autenticado", 401, "AUTH_REQUIRED");
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

export async function getRelatorioClockController(req: Request, res: Response, next: NextFunction) {
  try {
    ensureUser(req);
    const snapshot = getRelatorioClockService();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    return res.status(200).json(snapshot);
  } catch (error) {
    return next(error);
  }
}

export async function setRelatorioClockSimulationController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = ensureUser(req);

    if (process.env.NODE_ENV === "production") {
      throw new AppError("Simulacao de relogio indisponivel em producao.", 403, "CLOCK_SIMULATION_FORBIDDEN");
    }

    const { start } = relatorioClockSimulationSchema.parse(req.body);
    const snapshot = setRelatorioClockSimulationService(start ?? null);

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "CLOCK_SIMULATION_SET",
      entidade: "CLOCK",
      descricao: start ? "Horario de simulacao atualizado." : "Simulacao de horario desativada.",
      detalhes: {
        start: start ?? null,
      },
      contexto: getRequestMetadata(req),
    });

    return res.status(200).json(snapshot);
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
        message: "Nao existe relatorio em aberto.",
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
    const user = ensureUser(req);
    const report = await createNewReportService();

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "RELATORIO_CRIADO",
      entidade: "RELATORIO",
      entidadeId: report.id,
      descricao: "Relatorio diario criado.",
      detalhes: {
        dataRelatorio: report.dataRelatorio,
        status: report.status,
      },
      contexto: getRequestMetadata(req),
    });

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

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "RELATORIO_ITEM_CRIADO",
      entidade: "RELATORIO_ITEM",
      entidadeId: item.id,
      descricao: "Item adicionado ao relatorio.",
      detalhes: {
        relatorioId,
        perfilPessoa: item.perfilPessoa,
        empresa: item.empresa,
        placaVeiculo: item.placaVeiculo,
        nome: item.nome,
      },
      contexto: getRequestMetadata(req),
    });

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

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "RELATORIO_ITEM_ATUALIZADO",
      entidade: "RELATORIO_ITEM",
      entidadeId: item.id,
      descricao: "Item do relatorio atualizado.",
      detalhes: {
        relatorioId,
        perfilPessoa: item.perfilPessoa,
        empresa: item.empresa,
        placaVeiculo: item.placaVeiculo,
        nome: item.nome,
      },
      contexto: getRequestMetadata(req),
    });

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

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "RELATORIO_ITEM_EXCLUIDO",
      entidade: "RELATORIO_ITEM",
      entidadeId: itemId,
      descricao: "Item removido do relatorio.",
      detalhes: {
        relatorioId,
      },
      contexto: getRequestMetadata(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function closeRelatorioController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = ensureUser(req);
    const { relatorioId } = relatorioIdSchema.parse(req.params);

    const relatorio = await closeRelatorioService(relatorioId);

    await createAuditLog({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioLogin: user.usuario,
      acao: "RELATORIO_FECHADO",
      entidade: "RELATORIO",
      entidadeId: relatorio.id,
      descricao: "Relatorio fechado.",
      detalhes: {
        dataRelatorio: relatorio.dataRelatorio,
        status: relatorio.status,
      },
      contexto: getRequestMetadata(req),
    });

    return res.status(200).json(relatorio);
  } catch (error) {
    return next(error);
  }
}
