import { prisma } from "../lib/prisma";
import type { Prisma, StatusRelatorio } from "@prisma/client";

const usuarioResumoSelect = {
  id: true,
  nome: true,
  usuario: true,
  email: true,
  perfil: true,
  turno: true,
} as const;

const relatorioItensInclude = {
  include: {
    usuario: {
      select: usuarioResumoSelect,
    },
  },
  orderBy: {
    id: "desc" as const,
  },
} as const;

const relatorioWithItensInclude = {
  itens: relatorioItensInclude,
} as const;

const relatorioSummarySelect = {
  id: true,
  dataRelatorio: true,
  status: true,
  criadoEm: true,
  finalizadoEm: true,
  _count: {
    select: {
      itens: true,
    },
  },
} as const;

const relatorioBaseSelect = {
  id: true,
  dataRelatorio: true,
  status: true,
  criadoEm: true,
  finalizadoEm: true,
} as const;

const managedItemInclude = {
  relatorio: true,
  usuario: {
    select: usuarioResumoSelect,
  },
} as const;

export type UsuarioResumo = Prisma.UsuarioGetPayload<{
  select: typeof usuarioResumoSelect;
}>;

export type RelatorioComItens = Prisma.RelatorioGetPayload<{
  include: typeof relatorioWithItensInclude;
}>;

export type RelatorioResumo = Prisma.RelatorioGetPayload<{
  select: typeof relatorioSummarySelect;
}>;

export type RelatorioBase = Prisma.RelatorioGetPayload<{
  select: typeof relatorioBaseSelect;
}>;

export type RelatorioItemComUsuario = Prisma.RelatorioItemGetPayload<{
  include: typeof relatorioItensInclude.include;
}>;

export type RelatorioItemGerenciado = Prisma.RelatorioItemGetPayload<{
  include: typeof managedItemInclude;
}>;

export type RelatorioStatusMinimo = {
  id: number;
  status: StatusRelatorio;
};

export type RelatorioCleanupCandidate = {
  id: number;
  dataRelatorio: Date;
};

export interface IRelatorioRepository {
  findOpenReportsForCleanup(): Promise<RelatorioCleanupCandidate[]>;
  closeReportsByIds(reportIds: number[], finalizadoEm: Date): Promise<void>;
  findOpenReportWithItems(): Promise<RelatorioComItens | null>;
  createOpenReportWithItems(dataRelatorio: Date): Promise<RelatorioComItens>;
  listReportSummaries(): Promise<RelatorioResumo[]>;
  countClosedReports(where: Prisma.RelatorioWhereInput): Promise<number>;
  listClosedReports(where: Prisma.RelatorioWhereInput, page: number, pageSize: number): Promise<RelatorioResumo[]>;
  findReportByIdWithItems(relatorioId: number): Promise<RelatorioComItens | null>;
  findReportByIdWithoutItems(relatorioId: number): Promise<RelatorioBase | null>;
  listReportItemsByCursor(relatorioId: number, itemCursor: number | undefined, itemLimit: number): Promise<RelatorioItemComUsuario[]>;
  findReportById(relatorioId: number): Promise<Prisma.RelatorioGetPayload<object> | null>;
  findReportStatusById(relatorioId: number): Promise<RelatorioStatusMinimo | null>;
  createRelatorioItem(data: Prisma.RelatorioItemUncheckedCreateInput): Promise<Prisma.RelatorioItemGetPayload<object>>;
  findManagedItem(itemId: number): Promise<RelatorioItemGerenciado | null>;
  updateRelatorioItem(itemId: number, data: Prisma.RelatorioItemUncheckedUpdateInput): Promise<Prisma.RelatorioItemGetPayload<object>>;
  deleteRelatorioItemById(itemId: number): Promise<void>;
  updateRelatorioAsClosed(relatorioId: number, finalizadoEm: Date): Promise<Prisma.RelatorioGetPayload<object>>;
}

export const relatorioRepository: IRelatorioRepository = {
  async findOpenReportsForCleanup() {
    return prisma.relatorio.findMany({
      where: { status: "ABERTO" },
      select: {
        id: true,
        dataRelatorio: true,
      },
    });
  },

  async closeReportsByIds(reportIds: number[], finalizadoEm: Date) {
    if (reportIds.length === 0) {
      return;
    }

    await prisma.relatorio.updateMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      data: {
        status: "FECHADO",
        finalizadoEm,
      },
    });
  },

  async findOpenReportWithItems() {
    return prisma.relatorio.findFirst({
      where: {
        status: "ABERTO",
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: relatorioWithItensInclude,
    });
  },

  async createOpenReportWithItems(dataRelatorio: Date) {
    return prisma.relatorio.create({
      data: {
        dataRelatorio,
        status: "ABERTO",
      },
      include: relatorioWithItensInclude,
    });
  },

  async listReportSummaries() {
    return prisma.relatorio.findMany({
      select: relatorioSummarySelect,
      orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
    });
  },

  async countClosedReports(where: Prisma.RelatorioWhereInput) {
    return prisma.relatorio.count({ where });
  },

  async listClosedReports(where: Prisma.RelatorioWhereInput, page: number, pageSize: number) {
    return prisma.relatorio.findMany({
      where,
      select: relatorioSummarySelect,
      orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  },

  async findReportByIdWithItems(relatorioId: number) {
    return prisma.relatorio.findUnique({
      where: { id: relatorioId },
      include: relatorioWithItensInclude,
    });
  },

  async findReportByIdWithoutItems(relatorioId: number) {
    return prisma.relatorio.findUnique({
      where: { id: relatorioId },
      select: relatorioBaseSelect,
    });
  },

  async listReportItemsByCursor(relatorioId: number, itemCursor: number | undefined, itemLimit: number) {
    return prisma.relatorioItem.findMany({
      where: {
        relatorioId,
        ...(itemCursor ? { id: { lt: itemCursor } } : {}),
      },
      orderBy: {
        id: "desc",
      },
      take: itemLimit + 1,
      include: relatorioItensInclude.include,
    });
  },

  async findReportById(relatorioId: number) {
    return prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });
  },

  async findReportStatusById(relatorioId: number) {
    return prisma.relatorio.findUnique({
      where: { id: relatorioId },
      select: {
        id: true,
        status: true,
      },
    });
  },

  async createRelatorioItem(data: Prisma.RelatorioItemUncheckedCreateInput) {
    return prisma.relatorioItem.create({
      data,
    });
  },

  async findManagedItem(itemId: number) {
    return prisma.relatorioItem.findUnique({
      where: { id: itemId },
      include: managedItemInclude,
    });
  },

  async updateRelatorioItem(itemId: number, data: Prisma.RelatorioItemUncheckedUpdateInput) {
    return prisma.relatorioItem.update({
      where: { id: itemId },
      data,
    });
  },

  async deleteRelatorioItemById(itemId: number) {
    await prisma.relatorioItem.delete({
      where: { id: itemId },
    });
  },

  async updateRelatorioAsClosed(relatorioId: number, finalizadoEm: Date) {
    return prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        status: "FECHADO",
        finalizadoEm,
      },
    });
  },
};

export const findOpenReportsForCleanup = (...args: Parameters<IRelatorioRepository["findOpenReportsForCleanup"]>) =>
  relatorioRepository.findOpenReportsForCleanup(...args);
export const closeReportsByIds = (...args: Parameters<IRelatorioRepository["closeReportsByIds"]>) =>
  relatorioRepository.closeReportsByIds(...args);
export const findOpenReportWithItems = (...args: Parameters<IRelatorioRepository["findOpenReportWithItems"]>) =>
  relatorioRepository.findOpenReportWithItems(...args);
export const createOpenReportWithItems = (...args: Parameters<IRelatorioRepository["createOpenReportWithItems"]>) =>
  relatorioRepository.createOpenReportWithItems(...args);
export const listReportSummaries = (...args: Parameters<IRelatorioRepository["listReportSummaries"]>) =>
  relatorioRepository.listReportSummaries(...args);
export const countClosedReports = (...args: Parameters<IRelatorioRepository["countClosedReports"]>) =>
  relatorioRepository.countClosedReports(...args);
export const listClosedReports = (...args: Parameters<IRelatorioRepository["listClosedReports"]>) =>
  relatorioRepository.listClosedReports(...args);
export const findReportByIdWithItems = (...args: Parameters<IRelatorioRepository["findReportByIdWithItems"]>) =>
  relatorioRepository.findReportByIdWithItems(...args);
export const findReportById = (...args: Parameters<IRelatorioRepository["findReportById"]>) =>
  relatorioRepository.findReportById(...args);
export const findReportStatusById = (...args: Parameters<IRelatorioRepository["findReportStatusById"]>) =>
  relatorioRepository.findReportStatusById(...args);
export const createRelatorioItem = (...args: Parameters<IRelatorioRepository["createRelatorioItem"]>) =>
  relatorioRepository.createRelatorioItem(...args);
export const findManagedItem = (...args: Parameters<IRelatorioRepository["findManagedItem"]>) =>
  relatorioRepository.findManagedItem(...args);
export const updateRelatorioItem = (...args: Parameters<IRelatorioRepository["updateRelatorioItem"]>) =>
  relatorioRepository.updateRelatorioItem(...args);
export const deleteRelatorioItemById = (...args: Parameters<IRelatorioRepository["deleteRelatorioItemById"]>) =>
  relatorioRepository.deleteRelatorioItemById(...args);
export const updateRelatorioAsClosed = (...args: Parameters<IRelatorioRepository["updateRelatorioAsClosed"]>) =>
  relatorioRepository.updateRelatorioAsClosed(...args);
