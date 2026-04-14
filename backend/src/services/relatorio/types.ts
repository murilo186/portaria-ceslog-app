import type { IRelatorioRepository } from "../../repositories/relatorioRepository";
import type { AuthenticatedUser } from "../../types/auth";
import type { ClosedReportsQuery, RelatorioItemEditableInput, ReportItemsCursorQuery } from "../../types/relatorio";
import type { ClosedReportsResponse } from "./cache";
import type { RelatorioRuntimeDeps } from "./dependencies";
import type { RelatorioResponse, RelatorioResumoResponse } from "./dtoMappers";

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
  getOpenReportService(tenantId: number): Promise<RelatorioResponse | null>;
  createNewReportService(tenantId: number): Promise<RelatorioResponse>;
  getTodayReportService(tenantId: number): Promise<RelatorioResponse>;
  listReportsService(tenantId: number): Promise<RelatorioResumoResponse[]>;
  listClosedReportsService(tenantId: number, query: ClosedReportsQuery): Promise<ClosedReportsResponse>;
  getReportByIdService(
    tenantId: number,
    relatorioId: number,
    query?: ReportItemsCursorQuery,
  ): Promise<
    (RelatorioResponse & {
      itensPage?: {
        itemLimit: number;
        nextItemCursor: number | null;
        hasMore: boolean;
      };
    }) | null
  >;
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
  closeRelatorioService(tenantId: number, relatorioId: number): Promise<{
    id: number;
    status: "ABERTO" | "FECHADO";
    dataRelatorio: string;
    criadoEm: string;
    finalizadoEm: string | null;
  }>;
};
