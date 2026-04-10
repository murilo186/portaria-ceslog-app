import { relatorioRepository } from "../repositories/relatorioRepository";
import { createRelatorioService } from "./relatorio/createRelatorioService";
import { getReportClockSnapshot, setClockSimulationStart } from "../utils/clock";

const relatorioService = createRelatorioService({
  repository: relatorioRepository,
});

export const getOpenReportService = relatorioService.getOpenReportService;
export const createNewReportService = relatorioService.createNewReportService;
export const getTodayReportService = relatorioService.getTodayReportService;
export const listReportsService = relatorioService.listReportsService;
export const listClosedReportsService = relatorioService.listClosedReportsService;
export const getReportByIdService = relatorioService.getReportByIdService;
export const createRelatorioItemService = relatorioService.createRelatorioItemService;
export const updateRelatorioItemService = relatorioService.updateRelatorioItemService;
export const deleteRelatorioItemService = relatorioService.deleteRelatorioItemService;
export const closeRelatorioService = relatorioService.closeRelatorioService;

export function getRelatorioClockService() {
  return getReportClockSnapshot();
}

export function setRelatorioClockSimulationService(start: string | null) {
  return setClockSimulationStart(start);
}
