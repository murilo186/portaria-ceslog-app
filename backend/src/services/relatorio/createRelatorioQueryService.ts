import { AppError } from "../../middlewares/errorMiddleware";
import { Prisma } from "@prisma/client";
import type { ClosedReportsQuery } from "../../types/relatorio";
import type { RelatorioServiceApi, RelatorioServiceContext } from "./types";

export type RelatorioQueryServiceApi = Pick<
  RelatorioServiceApi,
  "listReportsService" | "listClosedReportsService" | "getReportByIdService"
>;

export function createRelatorioQueryService({ repository, runtime }: RelatorioServiceContext): RelatorioQueryServiceApi {
  async function listReportsService() {
    return repository.listReportSummaries();
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
      data,
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

  async function getReportByIdService(relatorioId: number) {
    const cached = runtime.cache.getReportDetailCache(relatorioId);

    if (cached) {
      return cached;
    }

    const relatorio = await repository.findReportByIdWithItems(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatorio nao encontrado", 404, "REPORT_NOT_FOUND");
    }

    runtime.cache.setReportDetailCache(relatorioId, relatorio);
    return relatorio;
  }

  return {
    listReportsService,
    listClosedReportsService,
    getReportByIdService,
  };
}
