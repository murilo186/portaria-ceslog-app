import type { IRelatorioRepository } from "../../repositories/relatorioRepository";
import type { AuthenticatedUser } from "../../types/auth";
import type { ClosedReportsQuery, RelatorioItemEditableInput } from "../../types/relatorio";
import type { ClosedReportsResponse } from "./cache";
import type { RelatorioRuntimeDeps } from "./dependencies";

export type RelatorioServiceDeps = {
  repository: IRelatorioRepository;
  runtime?: RelatorioRuntimeDeps;
};

export type RelatorioServiceContext = {
  repository: IRelatorioRepository;
  runtime: RelatorioRuntimeDeps;
};

export type RelatorioItemUsuario = {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: AuthenticatedUser["perfil"];
  turno: AuthenticatedUser["turno"];
};

export type RelatorioItemCreateResult = Awaited<ReturnType<IRelatorioRepository["createRelatorioItem"]>> & {
  usuario: RelatorioItemUsuario;
};

export type RelatorioItemUpdateResult = Awaited<ReturnType<IRelatorioRepository["updateRelatorioItem"]>> & {
  usuario: Awaited<ReturnType<IRelatorioRepository["findManagedItem"]>> extends infer T
    ? T extends { usuario: infer U }
      ? U
      : never
    : never;
};

export type RelatorioServiceApi = {
  getOpenReportService(): ReturnType<IRelatorioRepository["findOpenReportWithItems"]>;
  createNewReportService(): ReturnType<IRelatorioRepository["createOpenReportWithItems"]>;
  getTodayReportService(): ReturnType<IRelatorioRepository["createOpenReportWithItems"]>;
  listReportsService(): ReturnType<IRelatorioRepository["listReportSummaries"]>;
  listClosedReportsService(query: ClosedReportsQuery): Promise<ClosedReportsResponse>;
  getReportByIdService(relatorioId: number): ReturnType<IRelatorioRepository["findReportByIdWithItems"]>;
  createRelatorioItemService(
    relatorioId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ): Promise<RelatorioItemCreateResult>;
  updateRelatorioItemService(
    relatorioId: number,
    itemId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ): Promise<RelatorioItemUpdateResult>;
  deleteRelatorioItemService(relatorioId: number, itemId: number, user: AuthenticatedUser): Promise<{ ok: true }>;
  closeRelatorioService(relatorioId: number): ReturnType<IRelatorioRepository["updateRelatorioAsClosed"]>;
};
