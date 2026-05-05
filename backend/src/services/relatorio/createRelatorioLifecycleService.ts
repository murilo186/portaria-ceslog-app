import { AppError } from "../../middlewares/errorMiddleware";
import { Prisma } from "@prisma/client";
import { toRelatorioResponse } from "./dtoMappers";
import { RELATORIO_ERROR } from "./errors";
import type { RelatorioServiceApi, RelatorioServiceContext } from "./types";
import { getStoredReportDateKey, reportDateFromKey } from "../../utils/date";

export type RelatorioLifecycleServiceApi = Pick<
  RelatorioServiceApi,
  "getOpenReportService" | "createNewReportService" | "getTodayReportService" | "closeRelatorioService"
>;

function isDuplicateReportError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return true;
  }

  if (error && typeof error === "object") {
    const maybeNumber = (error as { number?: unknown }).number;
    const maybeMessage = String((error as { message?: unknown }).message ?? "");

    if (maybeNumber === 2627 || maybeNumber === 2601) {
      return true;
    }

    if (maybeMessage.toLowerCase().includes("duplicate key")) {
      return true;
    }
  }

  return false;
}

export function createRelatorioLifecycleService({ repository, runtime }: RelatorioServiceContext): RelatorioLifecycleServiceApi {
  async function createOpenReport(tenantId: number) {
    const businessDate = reportDateFromKey(runtime.clock.getCurrentBusinessDateKey());

    try {
      return await repository.createOpenReportWithItems(tenantId, businessDate);
    } catch (error) {
      if (isDuplicateReportError(error)) {
        throw RELATORIO_ERROR.dailyReportAlreadyExists();
      }

      throw error;
    }
  }

  async function getOpenReportService(tenantId: number) {
    const cached = runtime.cache.getOpenReportCache(tenantId);

    if (
      cached &&
      cached.status === "ABERTO" &&
      getStoredReportDateKey(cached.dataRelatorio) === runtime.clock.getCurrentBusinessDateKey()
    ) {
      return toRelatorioResponse(cached);
    }

    await runtime.staleReports.closeStaleOpenReports(repository);
    const openReport = await repository.findOpenReportWithItems(tenantId);

    if (openReport) {
      runtime.cache.setOpenReportCache(tenantId, openReport);
      return toRelatorioResponse(openReport);
    }

    return openReport;
  }

  async function createNewReportService(tenantId: number) {
    await runtime.staleReports.closeStaleOpenReports(repository);

    const report = await repository.findOpenReportWithItems(tenantId);

    if (report) {
      throw RELATORIO_ERROR.openReportExists();
    }

    const created = await createOpenReport(tenantId);
    runtime.cache.invalidateRelatorioReadCaches(tenantId, created.id);

    return toRelatorioResponse(created);
  }

  async function getTodayReportService(tenantId: number) {
    const businessDate = reportDateFromKey(runtime.clock.getCurrentBusinessDateKey());
    const report = await getOpenReportService(tenantId);

    if (report) {
      return report;
    }

    try {
      const created = await createOpenReport(tenantId);
      runtime.cache.invalidateRelatorioReadCaches(tenantId, created.id);
      return toRelatorioResponse(created);
    } catch (error) {
      if (error instanceof AppError && error.code === "DAILY_REPORT_ALREADY_EXISTS") {
        const reportFromToday = await repository.findReportByBusinessDateWithItems(tenantId, businessDate);

        if (reportFromToday) {
          runtime.cache.setReportDetailCache(tenantId, reportFromToday.id, reportFromToday);

          if (reportFromToday.status === "ABERTO") {
            runtime.cache.setOpenReportCache(tenantId, reportFromToday);
          }

          return toRelatorioResponse(reportFromToday);
        }
      }

      throw error;
    }
  }

  async function closeRelatorioService(tenantId: number, relatorioId: number) {
    const relatorio = await repository.findReportById(tenantId, relatorioId);

    if (!relatorio) {
      throw RELATORIO_ERROR.reportNotFound();
    }

    if (relatorio.status === "FECHADO") {
      return {
        ...relatorio,
        dataRelatorio: relatorio.dataRelatorio.toISOString(),
        criadoEm: relatorio.criadoEm.toISOString(),
        finalizadoEm: relatorio.finalizadoEm ? relatorio.finalizadoEm.toISOString() : null,
      };
    }

    const closed = await repository.updateRelatorioAsClosed(tenantId, relatorio.id, runtime.clock.getCurrentDate());
    runtime.cache.invalidateRelatorioReadCaches(tenantId, relatorio.id);
    return {
      ...closed,
      dataRelatorio: closed.dataRelatorio.toISOString(),
      criadoEm: closed.criadoEm.toISOString(),
      finalizadoEm: closed.finalizadoEm ? closed.finalizadoEm.toISOString() : null,
    };
  }

  return {
    getOpenReportService,
    createNewReportService,
    getTodayReportService,
    closeRelatorioService,
  };
}
