import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export function reportInclude() {
  return {
    itens: {
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            email: true,
            perfil: true,
            turno: true,
          },
        },
      },
      orderBy: {
        id: "desc" as const,
      },
    },
  };
}

export function reportSummarySelect() {
  return {
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
  } satisfies Prisma.RelatorioSelect;
}

export async function findOpenReportsForCleanup() {
  return prisma.relatorio.findMany({
    where: { status: "ABERTO" },
    select: {
      id: true,
      dataRelatorio: true,
    },
  });
}

export async function closeReportsByIds(reportIds: number[], finalizadoEm: Date) {
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
}

export async function findOpenReportWithItems() {
  return prisma.relatorio.findFirst({
    where: {
      status: "ABERTO",
    },
    orderBy: {
      criadoEm: "desc",
    },
    include: reportInclude(),
  });
}

export async function createOpenReportWithItems(dataRelatorio: Date) {
  return prisma.relatorio.create({
    data: {
      dataRelatorio,
      status: "ABERTO",
    },
    include: reportInclude(),
  });
}

export async function listReportSummaries() {
  return prisma.relatorio.findMany({
    select: reportSummarySelect(),
    orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
  });
}

export async function countClosedReports(where: Prisma.RelatorioWhereInput) {
  return prisma.relatorio.count({ where });
}

export async function listClosedReports(
  where: Prisma.RelatorioWhereInput,
  page: number,
  pageSize: number,
) {
  return prisma.relatorio.findMany({
    where,
    select: reportSummarySelect(),
    orderBy: [{ dataRelatorio: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
}

export async function findReportByIdWithItems(relatorioId: number) {
  return prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      itens: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              usuario: true,
              email: true,
              perfil: true,
              turno: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      },
    },
  });
}

export async function findReportById(relatorioId: number) {
  return prisma.relatorio.findUnique({
    where: { id: relatorioId },
  });
}

export async function findReportStatusById(relatorioId: number) {
  return prisma.relatorio.findUnique({
    where: { id: relatorioId },
    select: {
      id: true,
      status: true,
    },
  });
}

export async function createRelatorioItem(data: Prisma.RelatorioItemUncheckedCreateInput) {
  return prisma.relatorioItem.create({
    data,
  });
}

export async function findManagedItem(itemId: number) {
  return prisma.relatorioItem.findUnique({
    where: { id: itemId },
    include: {
      relatorio: true,
      usuario: {
        select: {
          id: true,
          nome: true,
          usuario: true,
          email: true,
          perfil: true,
          turno: true,
        },
      },
    },
  });
}

export async function updateRelatorioItem(
  itemId: number,
  data: Prisma.RelatorioItemUncheckedUpdateInput,
) {
  return prisma.relatorioItem.update({
    where: { id: itemId },
    data,
  });
}

export async function deleteRelatorioItemById(itemId: number) {
  await prisma.relatorioItem.delete({
    where: { id: itemId },
  });
}

export async function updateRelatorioAsClosed(relatorioId: number, finalizadoEm: Date) {
  return prisma.relatorio.update({
    where: { id: relatorioId },
    data: {
      status: "FECHADO",
      finalizadoEm,
    },
  });
}
