import { clearCacheByPrefix, getCachedValue, setCachedValue } from "../../lib/memoryCache";
import type { RelatorioComItens, RelatorioResumo } from "../../repositories/relatorioRepository";
import type { ClosedReportsQuery } from "../../types/relatorio";

const CLOSED_REPORTS_CACHE_PREFIX = "relatorios:fechados:";
const REPORT_DETAIL_CACHE_PREFIX = "relatorio:detalhe:";
const OPEN_REPORT_CACHE_KEY = "relatorio:aberto:current";
const CLOSED_REPORTS_CACHE_TTL_MS = 20_000;
const REPORT_DETAIL_CACHE_TTL_MS = 20_000;
const OPEN_REPORT_CACHE_TTL_MS = 5_000;

export type ClosedReportsResponse = {
  data: RelatorioResumo[];
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

export function getOpenReportCache() {
  return getCachedValue<RelatorioComItens>(OPEN_REPORT_CACHE_KEY);
}

export function setOpenReportCache(report: RelatorioComItens) {
  setCachedValue(OPEN_REPORT_CACHE_KEY, report, OPEN_REPORT_CACHE_TTL_MS);
}

export function getClosedReportsCache(query: ClosedReportsQuery) {
  const cacheKey = buildClosedReportsCacheKey(query);
  return getCachedValue<ClosedReportsResponse>(cacheKey);
}

export function setClosedReportsCache(query: ClosedReportsQuery, payload: ClosedReportsResponse) {
  const cacheKey = buildClosedReportsCacheKey(query);
  setCachedValue(cacheKey, payload, CLOSED_REPORTS_CACHE_TTL_MS);
}

export function getReportDetailCache(relatorioId: number) {
  const cacheKey = buildReportDetailCacheKey(relatorioId);
  return getCachedValue<RelatorioComItens>(cacheKey);
}

export function setReportDetailCache(relatorioId: number, report: RelatorioComItens) {
  const cacheKey = buildReportDetailCacheKey(relatorioId);
  setCachedValue(cacheKey, report, REPORT_DETAIL_CACHE_TTL_MS);
}

function invalidateClosedReportsCache() {
  clearCacheByPrefix(CLOSED_REPORTS_CACHE_PREFIX);
}

function invalidateReportDetailCache(relatorioId: number) {
  clearCacheByPrefix(buildReportDetailCacheKey(relatorioId));
}

export function invalidateRelatorioReadCaches(relatorioId?: number) {
  invalidateClosedReportsCache();
  clearCacheByPrefix(OPEN_REPORT_CACHE_KEY);

  if (typeof relatorioId === "number") {
    invalidateReportDetailCache(relatorioId);
    return;
  }

  clearCacheByPrefix(REPORT_DETAIL_CACHE_PREFIX);
}
