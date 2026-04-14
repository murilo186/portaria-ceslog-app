import { createAuditLog } from "../../services/auditService";
import {
  closeRelatorioService,
  createNewReportService,
  getOpenReportService,
  getReportByIdService,
  getTodayReportService,
  listClosedReportsService,
  listReportsService,
} from "../../services/relatorioService";
import { getRequestMetadata } from "../../utils/requestMetadata";
import {
  closedReportsQuerySchema,
  relatorioIdSchema,
  reportItemsCursorQuerySchema,
} from "../../validation/relatorioSchemas";
import { asyncHandler } from "../helpers/asyncHandler";
import { ensureAuthenticatedUser } from "../helpers/ensureAuthenticatedUser";

export const getTodayReportController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const report = await getTodayReportService(user.tenantId);
  return res.status(200).json(report);
});

export const getOpenReportController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const report = await getOpenReportService(user.tenantId);

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
  const report = await createNewReportService(user.tenantId);
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_created", {
    requestId: requestMeta.requestId,
    userId: user.id,
    tenantId: user.tenantId,
    relatorioId: report.id,
  });

  await createAuditLog({
    tenantId: user.tenantId,
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
    contexto: requestMeta,
  });

  return res.status(201).json(report);
});

export const listReportsController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const reports = await listReportsService(user.tenantId);
  return res.status(200).json(reports);
});

export const listClosedReportsController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const query = closedReportsQuerySchema.parse(req.query);
  const result = await listClosedReportsService(user.tenantId, query);

  return res.status(200).json(result);
});

export const getReportByIdController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const { relatorioId } = relatorioIdSchema.parse(req.params);
  const hasCursorQuery = "itemLimit" in req.query || "itemCursor" in req.query;
  const parsedCursorQuery = hasCursorQuery ? reportItemsCursorQuerySchema.parse(req.query) : undefined;
  const cursorQuery = parsedCursorQuery
    ? {
        itemCursor: parsedCursorQuery.itemCursor,
        itemLimit: parsedCursorQuery.itemLimit ?? 50,
      }
    : undefined;
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_detail_requested", {
    requestId: requestMeta.requestId,
    userId: user.id,
    tenantId: user.tenantId,
    relatorioId,
    itemCursor: cursorQuery?.itemCursor ?? null,
    itemLimit: cursorQuery?.itemLimit ?? null,
  });

  const report = await getReportByIdService(user.tenantId, relatorioId, cursorQuery);
  return res.status(200).json(report);
});

export const closeRelatorioController = asyncHandler(async (req, res) => {
  const user = ensureAuthenticatedUser(req);
  const { relatorioId } = relatorioIdSchema.parse(req.params);

  const relatorio = await closeRelatorioService(user.tenantId, relatorioId);
  const requestMeta = getRequestMetadata(req);

  console.info("relatorio_closed", {
    requestId: requestMeta.requestId,
    userId: user.id,
    tenantId: user.tenantId,
    relatorioId: relatorio.id,
  });

  await createAuditLog({
    tenantId: user.tenantId,
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
    contexto: requestMeta,
  });

  return res.status(200).json(relatorio);
});
