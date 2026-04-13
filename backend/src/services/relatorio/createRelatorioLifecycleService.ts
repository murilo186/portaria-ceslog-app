import { AppError } from "../../middlewares/errorMiddleware";
import { Prisma } from "@prisma/client";
import { toRelatorioResponse } from "./dtoMappers";
import { RELATORIO_ERROR } from "./errors";
import type { RelatorioServiceApi, RelatorioServiceContext } from "./types";

export type RelatorioLifecycleServiceApi = Pick<
  RelatorioServiceApi,
  "getOpenReportService" | "createNewReportService" | "getTodayReportService" | "closeRelatorioService"
>;

export function createRelatorioLifecycleService({ repository, runtime }: RelatorioServiceContext): RelatorioLifecycleServiceApi {
  async function createOpenReport() {
    try {
      return await repository.createOpenReportWithItems(runtime.clock.getCurrentDate());
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw RELATORIO_ERROR.dailyReportAlreadyExists();
      }

      throw error;
    }
  }

  async function getOpenReportService() {
    const cached = runtime.cache.getOpenReportCache();

    if (
      cached &&
      cached.status === "ABERTO" &&
      runtime.clock.getBusinessDateKey(cached.dataRelatorio) === runtime.clock.getCurrentBusinessDateKey()
    ) {
      return toRelatorioResponse(cached);
    }

    await runtime.staleReports.closeStaleOpenReports(repository);
    const openReport = await repository.findOpenReportWithItems();

    if (openReport) {
      runtime.cache.setOpenReportCache(openReport);
      return toRelatorioResponse(openReport);
    }

    return openReport;
  }

  async function createNewReportService() {
    await runtime.staleReports.closeStaleOpenReports(repository);

    const report = await repository.findOpenReportWithItems();

    if (report) {
      throw RELATORIO_ERROR.openReportExists();
    }

    const created = await createOpenReport();
    runtime.cache.invalidateRelatorioReadCaches(created.id);

    return toRelatorioResponse(created);
  }

  async function getTodayReportService() {
    const report = await getOpenReportService();

    if (report) {
      return report;
    }

    try {
      const created = await createOpenReport();
      runtime.cache.invalidateRelatorioReadCaches(created.id);
      return toRelatorioResponse(created);
    } catch (error) {
      if (error instanceof AppError && error.code === "DAILY_REPORT_ALREADY_EXISTS") {
        const currentOpenReport = await repository.findOpenReportWithItems();

        if (currentOpenReport) {
          return toRelatorioResponse(currentOpenReport);
        }
      }

      throw error;
    }
  }

  async function closeRelatorioService(relatorioId: number) {
    const relatorio = await repository.findReportById(relatorioId);

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

    const closed = await repository.updateRelatorioAsClosed(relatorio.id, runtime.clock.getCurrentDate());
    runtime.cache.invalidateRelatorioReadCaches(relatorio.id);
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
