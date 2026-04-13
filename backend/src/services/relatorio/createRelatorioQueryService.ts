import { Prisma } from "@prisma/client";
import type { ClosedReportsQuery, ReportItemsCursorQuery } from "../../types/relatorio";
import { RELATORIO_ERROR } from "./errors";
import { toRelatorioBaseResponse, toRelatorioResponse, toRelatorioResumoResponse } from "./dtoMappers";
import type { RelatorioServiceApi, RelatorioServiceContext } from "./types";

export type RelatorioQueryServiceApi = Pick<
  RelatorioServiceApi,
  "listReportsService" | "listClosedReportsService" | "getReportByIdService"
>;

export function createRelatorioQueryService({ repository, runtime }: RelatorioServiceContext): RelatorioQueryServiceApi {
  async function listReportsService() {
    const reports = await repository.listReportSummaries();
    return reports.map((report) => toRelatorioResumoResponse(report));
  }

  async function listClosedReportsService(query: ClosedReportsQuery) {
    const cached = runtime.cache.getClosedReportsCache(query);

    if (cached) {
      return cached;
    }

    const page = Math.max(1, query.page);
    const pageSize = Math.min(50, Math.max(1, query.pageSize));
    const normalizedSearch = query.busca?.trim();
    const canApplyTextSearch = Boolean(normalizedSearch && normalizedSearch.length >= 2);
    const dateRange = runtime.policies.getDateRange(query.data);

    const where: Prisma.RelatorioWhereInput = {
      status: "FECHADO",
    };

    if (dateRange) {
      where.dataRelatorio = dateRange;
    }

    if (canApplyTextSearch && normalizedSearch) {
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
      repository.countClosedReports(where),
      repository.listClosedReports(where, page, pageSize),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

    const payload = {
      data: data.map((report) => toRelatorioResumoResponse(report)),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };

    runtime.cache.setClosedReportsCache(query, payload);
    return payload;
  }

  async function getReportByIdService(relatorioId: number, query?: ReportItemsCursorQuery) {
    if (query?.itemLimit) {
      const relatorio = await repository.findReportByIdWithoutItems(relatorioId);

      if (!relatorio) {
        throw RELATORIO_ERROR.reportNotFound();
      }

      const rawItems = await repository.listReportItemsByCursor(relatorioId, query.itemCursor, query.itemLimit);
      const hasMore = rawItems.length > query.itemLimit;
      const items = hasMore ? rawItems.slice(0, query.itemLimit) : rawItems;
      const nextItemCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      return {
        ...toRelatorioBaseResponse(relatorio, items),
        itensPage: {
          itemLimit: query.itemLimit,
          nextItemCursor,
          hasMore,
        },
      };
    }

    const cached = runtime.cache.getReportDetailCache(relatorioId);

    if (cached) {
      return toRelatorioResponse(cached);
    }

    const relatorio = await repository.findReportByIdWithItems(relatorioId);

    if (!relatorio) {
      throw RELATORIO_ERROR.reportNotFound();
    }

    runtime.cache.setReportDetailCache(relatorioId, relatorio);
    return toRelatorioResponse(relatorio);
  }

  return {
    listReportsService,
    listClosedReportsService,
    getReportByIdService,
  };
}
