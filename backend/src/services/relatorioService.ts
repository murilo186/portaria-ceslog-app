import { Prisma } from "@prisma/client";
import {
  closeReportsByIds,
  countClosedReports,
  createOpenReportWithItems,
  createRelatorioItemWithUsuario,
  deleteRelatorioItemById,
  findManagedItem,
  findOpenReportWithItems,
  findOpenReportsForCleanup,
  findReportById,
  findReportByIdWithItems,
  listClosedReports,
  listReportSummaries,
  updateRelatorioAsClosed,
  updateRelatorioItemWithUsuario,
} from "../repositories/relatorioRepository";
import { clearCacheByPrefix, getCachedValue, setCachedValue } from "../lib/memoryCache";
import { AppError } from "../middlewares/errorMiddleware";
import type { AuthenticatedUser } from "../types/auth";
import type { ClosedReportsQuery, RelatorioItemEditableInput } from "../types/relatorio";
import { getCurrentBusinessDateKey, getCurrentDate, getReportClockSnapshot, setClockSimulationStart } from "../utils/clock";
import { getBusinessDateKey } from "../utils/date";

const CLOSED_REPORTS_CACHE_PREFIX = "relatorios:fechados:";
const REPORT_DETAIL_CACHE_PREFIX = "relatorio:detalhe:";
const CLOSED_REPORTS_CACHE_TTL_MS = 20_000;
const REPORT_DETAIL_CACHE_TTL_MS = 20_000;

type ClosedReportsResponse = {
  data: Awaited<ReturnType<typeof listClosedReports>>;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function buildClosedReportsCacheKey(query: ClosedReportsQuery) {
  const data = query.data?.trim() ?? "";
  const busca = query.busca?.trim().toLowerCase() ?? "";
  return `${CLOSED_REPORTS_CACHE_PREFIX}${query.page}:${query.pageSize}:${data}:${busca}`;
}

function buildReportDetailCacheKey(relatorioId: number) {
  return `${REPORT_DETAIL_CACHE_PREFIX}${relatorioId}`;
}

function invalidateClosedReportsCache() {
  clearCacheByPrefix(CLOSED_REPORTS_CACHE_PREFIX);
}

function invalidateReportDetailCache(relatorioId: number) {
  clearCacheByPrefix(buildReportDetailCacheKey(relatorioId));
}

function invalidateRelatorioReadCaches(relatorioId?: number) {
  invalidateClosedReportsCache();

  if (typeof relatorioId === "number") {
    invalidateReportDetailCache(relatorioId);
    return;
  }

  clearCacheByPrefix(REPORT_DETAIL_CACHE_PREFIX);
}

async function closeStaleOpenReports() {
  const todayKey = getCurrentBusinessDateKey();
  const openReports = await findOpenReportsForCleanup();

  const staleIds = openReports
    .filter((report) => getBusinessDateKey(report.dataRelatorio) !== todayKey)
    .map((report) => report.id);

  if (staleIds.length === 0) {
    return;
  }

  await closeReportsByIds(staleIds, getCurrentDate());
  invalidateRelatorioReadCaches();
}

async function findOpenReport() {
  return findOpenReportWithItems();
}

async function createOpenReport() {
  try {
    return await createOpenReportWithItems(getCurrentDate());
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Já existe um relatório para o dia atual.", 409, "DAILY_REPORT_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function getOpenReportService() {
  await closeStaleOpenReports();
  return findOpenReport();
}

export async function createNewReportService() {
  await closeStaleOpenReports();

  const report = await findOpenReport();

  if (report) {
    throw new AppError("Já existe um relatório em aberto.", 409, "OPEN_REPORT_EXISTS");
  }

  const created = await createOpenReport();
  invalidateRelatorioReadCaches(created.id);

  return created;
}

export async function getTodayReportService() {
  const report = await getOpenReportService();

  if (report) {
    return report;
  }

  try {
    const created = await createOpenReport();
    invalidateRelatorioReadCaches(created.id);
    return created;
  } catch (error) {
    if (error instanceof AppError && error.code === "DAILY_REPORT_ALREADY_EXISTS") {
      const currentOpenReport = await findOpenReport();

      if (currentOpenReport) {
        return currentOpenReport;
      }
    }

    throw error;
  }
}

export async function listReportsService() {
  return listReportSummaries();
}

function getDateRange(data?: string): { gte: Date; lt: Date } | undefined {
  if (!data) {
    return undefined;
  }

  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(data);

  if (!isIsoDate) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD.", 400, "INVALID_DATE_FILTER");
  }

  const start = new Date(`${data}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD.", 400, "INVALID_DATE_FILTER");
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    gte: start,
    lt: end,
  };
}

export async function listClosedReportsService(query: ClosedReportsQuery) {
  const cacheKey = buildClosedReportsCacheKey(query);
  const cached = getCachedValue<ClosedReportsResponse>(cacheKey);

  if (cached) {
    return cached;
  }

  const page = Math.max(1, query.page);
  const pageSize = Math.min(50, Math.max(1, query.pageSize));
  const normalizedSearch = query.busca?.trim();
  const dateRange = getDateRange(query.data);

  const where: Prisma.RelatorioWhereInput = {
    status: "FECHADO",
  };

  if (dateRange) {
    where.dataRelatorio = dateRange;
  }

  if (normalizedSearch) {
    where.itens = {
      some: {
        OR: [
          {
            placaVeiculo: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            nome: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        ],
      },
    };
  }

  const [total, data] = await Promise.all([
    countClosedReports(where),
    listClosedReports(where, page, pageSize),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  const payload: ClosedReportsResponse = {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };

  setCachedValue(cacheKey, payload, CLOSED_REPORTS_CACHE_TTL_MS);

  return payload;
}

export async function getReportByIdService(relatorioId: number) {
  const cacheKey = buildReportDetailCacheKey(relatorioId);
  const cached = getCachedValue<Awaited<ReturnType<typeof findReportByIdWithItems>>>(cacheKey);

  if (cached) {
    return cached;
  }

  const relatorio = await findReportByIdWithItems(relatorioId);

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  setCachedValue(cacheKey, relatorio, REPORT_DETAIL_CACHE_TTL_MS);

  return relatorio;
}

function parseNullableString(value?: string): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export async function createRelatorioItemService(
  relatorioId: number,
  payload: RelatorioItemEditableInput,
  user: AuthenticatedUser,
) {
  const relatorio = await findReportById(relatorioId);

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  if (relatorio.status === "FECHADO") {
    throw new AppError("Relatório fechado. Não é possível adicionar itens.", 409, "REPORT_CLOSED");
  }

  const created = await createRelatorioItemWithUsuario({
    relatorioId: relatorio.id,
    usuarioId: user.id,
    perfilPessoa: payload.perfilPessoa,
    empresa: payload.empresa.trim(),
    placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
    nome: payload.nome.trim(),
    horaEntrada: parseNullableString(payload.horaEntrada),
    horaSaida: parseNullableString(payload.horaSaida),
    observacoes: parseNullableString(payload.observacoes),
    turno: user.turno,
  });

  invalidateRelatorioReadCaches(relatorio.id);

  return created;
}

async function getManagedRelatorioItem(relatorioId: number, itemId: number) {
  const item = await findManagedItem(itemId);

  if (!item || item.relatorioId !== relatorioId) {
    throw new AppError("Item do relatório não encontrado", 404, "ITEM_NOT_FOUND");
  }

  return item;
}

function assertCanManageItem(user: AuthenticatedUser, itemUserId: number, status: string) {
  if (status === "FECHADO") {
    throw new AppError("Relatório fechado. Não é possível alterar itens.", 409, "REPORT_CLOSED");
  }

  const isOwner = user.id === itemUserId;
  const isAdmin = user.perfil === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Sem permissão para alterar item de outro usuário", 403, "FORBIDDEN_ITEM_OWNER");
  }
}

export async function updateRelatorioItemService(
  relatorioId: number,
  itemId: number,
  payload: RelatorioItemEditableInput,
  user: AuthenticatedUser,
) {
  const item = await getManagedRelatorioItem(relatorioId, itemId);

  assertCanManageItem(user, item.usuarioId, item.relatorio.status);

  const updated = await updateRelatorioItemWithUsuario(item.id, {
    perfilPessoa: payload.perfilPessoa,
    empresa: payload.empresa.trim(),
    placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
    nome: payload.nome.trim(),
    horaEntrada: parseNullableString(payload.horaEntrada),
    horaSaida: parseNullableString(payload.horaSaida),
    observacoes: parseNullableString(payload.observacoes),
  });

  invalidateRelatorioReadCaches(item.relatorioId);

  return updated;
}

export async function deleteRelatorioItemService(
  relatorioId: number,
  itemId: number,
  user: AuthenticatedUser,
) {
  const item = await getManagedRelatorioItem(relatorioId, itemId);

  assertCanManageItem(user, item.usuarioId, item.relatorio.status);

  await deleteRelatorioItemById(item.id);
  invalidateRelatorioReadCaches(item.relatorioId);

  return { ok: true };
}

export async function closeRelatorioService(relatorioId: number) {
  const relatorio = await findReportById(relatorioId);

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  if (relatorio.status === "FECHADO") {
    return relatorio;
  }

  const closed = await updateRelatorioAsClosed(relatorio.id, getCurrentDate());
  invalidateRelatorioReadCaches(relatorio.id);

  return closed;
}

export function getRelatorioClockService() {
  return getReportClockSnapshot();
}

export function setRelatorioClockSimulationService(start: string | null) {
  return setClockSimulationStart(start);
}
