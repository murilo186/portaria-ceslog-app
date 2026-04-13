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
import {
  closedReportsQuerySchema,
  relatorioClockSimulationSchema,
  relatorioIdSchema,
  relatorioItemIdSchema,
  relatorioItemSchema,
} from "../validation/relatorioSchemas";
import { asyncHandler } from "./helpers/asyncHandler";
import { ensureAuthenticatedUser } from "./helpers/ensureAuthenticatedUser";

export const getTodayReportController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const report = await getTodayReportService();
  return res.status(200).json(report);
});

export const getRelatorioClockController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const snapshot = getRelatorioClockService();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.status(200).json(snapshot);
});

export const setRelatorioClockSimulationController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);

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
});

export const getOpenReportController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const report = await getOpenReportService();

  if (!report) {
    return res.status(404).json({
      message: "Nao existe relatorio em aberto.",
      code: "OPEN_REPORT_NOT_FOUND",
    });
  }

  return res.status(200).json(report);
});

export const createNewReportController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
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
});

export const listReportsController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const reports = await listReportsService();
  return res.status(200).json(reports);
});

export const listClosedReportsController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const query = closedReportsQuerySchema.parse(req.query);
  const result = await listClosedReportsService(query);

  return res.status(200).json(result);
});

export const getReportByIdController = asyncHandler(async (req, res) => {
  ensureAuthenticatedUser(req);
  const { relatorioId } = relatorioIdSchema.parse(req.params);
  const report = await getReportByIdService(relatorioId);

  return res.status(200).json(report);
});

export const createRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
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
});

export const updateRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
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
});

export const deleteRelatorioItemController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
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
});

export const closeRelatorioController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
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
});
