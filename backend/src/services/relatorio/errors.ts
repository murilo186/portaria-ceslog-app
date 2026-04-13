import { AppError } from "../../middlewares/errorMiddleware";

export const RELATORIO_ERROR = {
  dailyReportAlreadyExists: () =>
    new AppError("Ja existe um relatorio para o dia atual.", 409, "DAILY_REPORT_ALREADY_EXISTS"),
  openReportExists: () => new AppError("Ja existe um relatorio em aberto.", 409, "OPEN_REPORT_EXISTS"),
  openReportNotFound: () => new AppError("Nao existe relatorio em aberto.", 404, "OPEN_REPORT_NOT_FOUND"),
  reportNotFound: () => new AppError("Relatorio nao encontrado.", 404, "REPORT_NOT_FOUND"),
  itemNotFound: () => new AppError("Item do relatorio nao encontrado.", 404, "ITEM_NOT_FOUND"),
  reportClosed: () => new AppError("Relatorio fechado. Nao e possivel alterar itens.", 409, "REPORT_CLOSED"),
  forbiddenItemOwner: () => new AppError("Sem permissao para alterar item de outro usuario.", 403, "FORBIDDEN_ITEM_OWNER"),
  invalidDateFilter: () => new AppError("Data invalida. Use o formato AAAA-MM-DD.", 400, "INVALID_DATE_FILTER"),
  clockSimulationForbidden: () =>
    new AppError("Simulacao de relogio indisponivel em producao.", 403, "CLOCK_SIMULATION_FORBIDDEN"),
} as const;
