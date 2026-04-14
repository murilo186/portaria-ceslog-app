import { clearCacheByPrefix, getCachedValue, setCachedValue } from "../../lib/memoryCache";
import type { RelatorioComItens } from "../../repositories/relatorioRepository";
import type { ClosedReportsQuery } from "../../types/relatorio";
import type { RelatorioResumoResponse } from "./dtoMappers";

const CLOSED_REPORTS_CACHE_PREFIX = "relatorios:fechados:";
const REPORT_DETAIL_CACHE_PREFIX = "relatorio:detalhe:";
const OPEN_REPORT_CACHE_KEY = "relatorio:aberto:current";
const CLOSED_REPORTS_CACHE_TTL_MS = 20_000;
const REPORT_DETAIL_CACHE_TTL_MS = 20_000;
const OPEN_REPORT_CACHE_TTL_MS = 5_000;

export type ClosedReportsResponse = {
  data: RelatorioResumoResponse[];
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

function buildReportDetailCacheKey(tenantId: number, relatorioId: number) {
  return `${REPORT_DETAIL_CACHE_PREFIX}${tenantId}:${relatorioId}`;
}

function buildOpenReportCacheKey(tenantId: number) {
  return `${OPEN_REPORT_CACHE_KEY}:${tenantId}`;
}

export function getOpenReportCache(tenantId: number) {
  return getCachedValue<RelatorioComItens>(buildOpenReportCacheKey(tenantId));
}

export function setOpenReportCache(tenantId: number, report: RelatorioComItens) {
  setCachedValue(buildOpenReportCacheKey(tenantId), report, OPEN_REPORT_CACHE_TTL_MS);
}

export function getClosedReportsCache(tenantId: number, query: ClosedReportsQuery) {
  const cacheKey = `${tenantId}:${buildClosedReportsCacheKey(query)}`;
  return getCachedValue<ClosedReportsResponse>(cacheKey);
}

export function setClosedReportsCache(tenantId: number, query: ClosedReportsQuery, payload: ClosedReportsResponse) {
  const cacheKey = `${tenantId}:${buildClosedReportsCacheKey(query)}`;
  setCachedValue(cacheKey, payload, CLOSED_REPORTS_CACHE_TTL_MS);
}

export function getReportDetailCache(tenantId: number, relatorioId: number) {
  const cacheKey = buildReportDetailCacheKey(tenantId, relatorioId);
  return getCachedValue<RelatorioComItens>(cacheKey);
}

export function setReportDetailCache(tenantId: number, relatorioId: number, report: RelatorioComItens) {
  const cacheKey = buildReportDetailCacheKey(tenantId, relatorioId);
  setCachedValue(cacheKey, report, REPORT_DETAIL_CACHE_TTL_MS);
}

function invalidateClosedReportsCache(tenantId: number) {
  clearCacheByPrefix(`${tenantId}:${CLOSED_REPORTS_CACHE_PREFIX}`);
}

function invalidateReportDetailCache(tenantId: number, relatorioId: number) {
  clearCacheByPrefix(buildReportDetailCacheKey(tenantId, relatorioId));
}

export function invalidateRelatorioReadCaches(tenantId?: number, relatorioId?: number) {
  if (typeof tenantId !== "number") {
    clearCacheByPrefix(CLOSED_REPORTS_CACHE_PREFIX);
    clearCacheByPrefix(OPEN_REPORT_CACHE_KEY);
    clearCacheByPrefix(REPORT_DETAIL_CACHE_PREFIX);
    return;
  }

  invalidateClosedReportsCache(tenantId);
  clearCacheByPrefix(buildOpenReportCacheKey(tenantId));

  if (typeof relatorioId === "number") {
    invalidateReportDetailCache(tenantId, relatorioId);
    return;
  }

  clearCacheByPrefix(`${REPORT_DETAIL_CACHE_PREFIX}${tenantId}:`);
}
