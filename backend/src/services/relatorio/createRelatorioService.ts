import { AppError } from "../../middlewares/errorMiddleware";
import {
  getClosedReportsCache,
  getOpenReportCache,
  getReportDetailCache,
  invalidateRelatorioReadCaches,
  setClosedReportsCache,
  setOpenReportCache,
  setReportDetailCache,
  type ClosedReportsResponse,
} from "./cache";
import { assertCanManageItem, getDateRange } from "./policies";
import { closeStaleOpenReports } from "./staleReports";
import { sanitizeNullableText, sanitizeText } from "../../utils/sanitize";
import { Prisma } from "@prisma/client";
import type { IRelatorioRepository } from "../../repositories/relatorioRepository";
import type { AuthenticatedUser } from "../../types/auth";
import type { ClosedReportsQuery, RelatorioItemEditableInput } from "../../types/relatorio";
import { getCurrentBusinessDateKey, getCurrentDate } from "../../utils/clock";
import { getBusinessDateKey } from "../../utils/date";

export type RelatorioServiceDeps = {
  repository: IRelatorioRepository;
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
  ): Promise<
    Awaited<ReturnType<IRelatorioRepository["createRelatorioItem"]>> & {
      usuario: {
        id: number;
        nome: string;
        usuario: string | null;
        email: string | null;
        perfil: AuthenticatedUser["perfil"];
        turno: AuthenticatedUser["turno"];
      };
    }
  >;
  updateRelatorioItemService(
    relatorioId: number,
    itemId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ): Promise<
    Awaited<ReturnType<IRelatorioRepository["updateRelatorioItem"]>> & {
      usuario: Awaited<ReturnType<IRelatorioRepository["findManagedItem"]>> extends infer T
        ? T extends { usuario: infer U }
          ? U
          : never
        : never;
    }
  >;
  deleteRelatorioItemService(relatorioId: number, itemId: number, user: AuthenticatedUser): Promise<{ ok: true }>;
  closeRelatorioService(relatorioId: number): ReturnType<IRelatorioRepository["updateRelatorioAsClosed"]>;
};

export function createRelatorioService({ repository }: RelatorioServiceDeps): RelatorioServiceApi {
  async function createOpenReport() {
    try {
      return await repository.createOpenReportWithItems(getCurrentDate());
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Já existe um relatório para o dia atual.", 409, "DAILY_REPORT_ALREADY_EXISTS");
      }

      throw error;
    }
  }

  async function getManagedRelatorioItem(relatorioId: number, itemId: number) {
    const item = await repository.findManagedItem(itemId);

    if (!item || item.relatorioId !== relatorioId) {
      throw new AppError("Item do relatório não encontrado", 404, "ITEM_NOT_FOUND");
    }

    return item;
  }

  async function getOpenReportService() {
    const cached = getOpenReportCache();

    if (cached && cached.status === "ABERTO" && getBusinessDateKey(cached.dataRelatorio) === getCurrentBusinessDateKey()) {
      return cached;
    }

    await closeStaleOpenReports(repository);
    const openReport = await repository.findOpenReportWithItems();

    if (openReport) {
      setOpenReportCache(openReport);
    }

    return openReport;
  }

  async function createNewReportService() {
    await closeStaleOpenReports(repository);

    const report = await repository.findOpenReportWithItems();

    if (report) {
      throw new AppError("Já existe um relatório em aberto.", 409, "OPEN_REPORT_EXISTS");
    }

    const created = await createOpenReport();
    invalidateRelatorioReadCaches(created.id);

    return created;
  }

  async function getTodayReportService() {
    const report = await getOpenReportService();

    if (report) {
      return report;
    }

    try {
      const created = await createOpenReport();
      invalidateRelatorioReadCaches(created.id);
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

  async function listReportsService() {
    return repository.listReportSummaries();
  }

  async function listClosedReportsService(query: ClosedReportsQuery) {
    const cached = getClosedReportsCache(query);

    if (cached) {
      return cached;
    }

    const page = Math.max(1, query.page);
    const pageSize = Math.min(50, Math.max(1, query.pageSize));
    const normalizedSearch = query.busca?.trim();
    const dateRange = getDateRange(query.data);

    const where: Prisma.RelatorioWhereInput = {
      status: "FECHADO",
    };

    if (dateRange) {
      where.dataRelatorio = dateRange;
    }

    if (normalizedSearch) {
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

    const payload: ClosedReportsResponse = {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };

    setClosedReportsCache(query, payload);
    return payload;
  }

  async function getReportByIdService(relatorioId: number) {
    const cached = getReportDetailCache(relatorioId);

    if (cached) {
      return cached;
    }

    const relatorio = await repository.findReportByIdWithItems(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
    }

    setReportDetailCache(relatorioId, relatorio);
    return relatorio;
  }

  async function createRelatorioItemService(
    relatorioId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ) {
    const relatorio = await repository.findReportStatusById(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
    }

    if (relatorio.status === "FECHADO") {
      throw new AppError("Relatório fechado. Não é possível adicionar itens.", 409, "REPORT_CLOSED");
    }

    const created = await repository.createRelatorioItem({
      relatorioId: relatorio.id,
      usuarioId: user.id,
      perfilPessoa: payload.perfilPessoa,
      empresa: sanitizeText(payload.empresa),
      placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
      nome: sanitizeText(payload.nome),
      horaEntrada: sanitizeNullableText(payload.horaEntrada),
      horaSaida: sanitizeNullableText(payload.horaSaida),
      observacoes: sanitizeNullableText(payload.observacoes),
      turno: user.turno,
    });

    invalidateRelatorioReadCaches(relatorio.id);

    return {
      ...created,
      usuario: {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        email: user.email,
        perfil: user.perfil,
        turno: user.turno,
      },
    };
  }

  async function updateRelatorioItemService(
    relatorioId: number,
    itemId: number,
    payload: RelatorioItemEditableInput,
    user: AuthenticatedUser,
  ) {
    const item = await getManagedRelatorioItem(relatorioId, itemId);
    assertCanManageItem(user, item.usuarioId, item.relatorio.status);

    const updated = await repository.updateRelatorioItem(item.id, {
      perfilPessoa: payload.perfilPessoa,
      empresa: sanitizeText(payload.empresa),
      placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
      nome: sanitizeText(payload.nome),
      horaEntrada: sanitizeNullableText(payload.horaEntrada),
      horaSaida: sanitizeNullableText(payload.horaSaida),
      observacoes: sanitizeNullableText(payload.observacoes),
    });

    invalidateRelatorioReadCaches(item.relatorioId);

    return {
      ...updated,
      usuario: item.usuario,
    };
  }

  async function deleteRelatorioItemService(relatorioId: number, itemId: number, user: AuthenticatedUser) {
    const item = await getManagedRelatorioItem(relatorioId, itemId);
    assertCanManageItem(user, item.usuarioId, item.relatorio.status);

    await repository.deleteRelatorioItemById(item.id);
    invalidateRelatorioReadCaches(item.relatorioId);

    return { ok: true } as const;
  }

  async function closeRelatorioService(relatorioId: number) {
    const relatorio = await repository.findReportById(relatorioId);

    if (!relatorio) {
      throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
    }

    if (relatorio.status === "FECHADO") {
      return relatorio;
    }

    const closed = await repository.updateRelatorioAsClosed(relatorio.id, getCurrentDate());
    invalidateRelatorioReadCaches(relatorio.id);
    return closed;
  }

  return {
    getOpenReportService,
    createNewReportService,
    getTodayReportService,
    listReportsService,
    listClosedReportsService,
    getReportByIdService,
    createRelatorioItemService,
    updateRelatorioItemService,
    deleteRelatorioItemService,
    closeRelatorioService,
  };
}
