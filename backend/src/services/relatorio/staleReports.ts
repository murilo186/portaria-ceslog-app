import { invalidateRelatorioReadCaches } from "./cache";
import type { IRelatorioRepository } from "../../repositories/relatorioRepository";
import { getCurrentBusinessDateKey, getCurrentDate } from "../../utils/clock";
import { getBusinessDateKey } from "../../utils/date";

export async function closeStaleOpenReports(repository: IRelatorioRepository) {
  const todayKey = getCurrentBusinessDateKey();
  const openReports = await repository.findOpenReportsForCleanup();

  const staleIds = openReports
    .filter((report) => getBusinessDateKey(report.dataRelatorio) !== todayKey)
    .map((report) => report.id);

  if (staleIds.length === 0) {
    return;
  }

  await repository.closeReportsByIds(staleIds, getCurrentDate());
  invalidateRelatorioReadCaches();
}
