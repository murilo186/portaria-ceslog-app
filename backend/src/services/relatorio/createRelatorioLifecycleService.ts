import { AppError } from "../../middlewares/errorMiddleware";
import { Prisma } from "@prisma/client";
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
        throw new AppError("Ja existe um relatorio para o dia atual.", 409, "DAILY_REPORT_ALREADY_EXISTS");
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
      return cached;
    }

    await runtime.staleReports.closeStaleOpenReports(repository);
    const openReport = await repository.findOpenReportWithItems();

    if (openReport) {
      runtime.cache.setOpenReportCache(openReport);
    }

    return openReport;
  }

  async function createNewReportService() {
    await runtime.staleReports.closeStaleOpenReports(repository);

    const report = await repository.findOpenReportWithItems();

    if (report) {
      throw new AppError("Ja existe um relatorio em aberto.", 409, "OPEN_REPORT_EXISTS");
    }

    const created = await createOpenReport();
    runtime.cache.invalidateRelatorioReadCaches(created.id);

    return created;
  }

  async function getTodayReportService() {
    const report = await getOpenReportService();

    if (report) {
      return report;
    }

    try {
      const created = await createOpenReport();
      runtime.cache.invalidateRelatorioReadCaches(created.id);
      return created;
    } catch (error) {
      if (error instanceof AppError && error.code === "DAILY_REPORT_ALREADY_EXISTS") {
        const currentOpenReport = await repository.findOpenReportWithItems();

        if (currentOpenReport) {
          return currentOpenReport;
        }
      }

      throw error;
    }
  }

  async function closeRelatorioService(relatorioId: number) {
    const relatorio = await repository.findReportById(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatorio nao encontrado", 404, "REPORT_NOT_FOUND");
    }

    if (relatorio.status === "FECHADO") {
      return relatorio;
    }

    const closed = await repository.updateRelatorioAsClosed(relatorio.id, runtime.clock.getCurrentDate());
    runtime.cache.invalidateRelatorioReadCaches(relatorio.id);
    return closed;
  }

  return {
    getOpenReportService,
    createNewReportService,
    getTodayReportService,
    closeRelatorioService,
  };
}
