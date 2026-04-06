import { AppError } from "../middlewares/errorMiddleware";
import { prisma } from "../lib/prisma";
import { getBusinessDateKey } from "../utils/date";
import type { AuthenticatedUser } from "../types/auth";
import type { ClosedReportsQuery, RelatorioItemEditableInput } from "../types/relatorio";
import type { Prisma } from "@prisma/client";

function reportInclude() {
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

async function closeStaleOpenReports() {
  const todayKey = getBusinessDateKey();

  const openReports = await prisma.relatorio.findMany({
    where: { status: "ABERTO" },
    select: {
      id: true,
      dataRelatorio: true,
    },
  });

  const staleIds = openReports
    .filter((report) => getBusinessDateKey(report.dataRelatorio) !== todayKey)
    .map((report) => report.id);

  if (staleIds.length === 0) {
    return;
  }

  await prisma.relatorio.updateMany({
    where: {
      id: {
        in: staleIds,
      },
    },
    data: {
      status: "FECHADO",
      finalizadoEm: new Date(),
    },
  });
}

async function findOpenReport() {
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

async function createOpenReport() {
  return prisma.relatorio.create({
    data: {
      dataRelatorio: new Date(),
      status: "ABERTO",
    },
    include: reportInclude(),
  });
}

export async function getOpenReportService() {
  await closeStaleOpenReports();
  return findOpenReport();
}

export async function createNewReportService() {
  await closeStaleOpenReports();

  const report = await findOpenReport();

  if (report) {
    throw new AppError("Já existe um relatório em aberto.", 409, "OPEN_REPORT_EXISTS");
  }

  return createOpenReport();
}

export async function getTodayReportService() {
  const report = await getOpenReportService();

  if (report) {
    return report;
  }

  return createOpenReport();
}

export async function listReportsService() {
  return prisma.relatorio.findMany({
    include: {
      _count: {
        select: {
          itens: true,
        },
      },
    },
    orderBy: {
      dataRelatorio: "desc",
    },
  });
}

function getDateRange(data?: string): { gte: Date; lt: Date } | undefined {
  if (!data) {
    return undefined;
  }

  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(data);

  if (!isIsoDate) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD.", 400, "INVALID_DATE_FILTER");
  }

  const start = new Date(`${data}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD.", 400, "INVALID_DATE_FILTER");
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    gte: start,
    lt: end,
  };
}

export async function listClosedReportsService(query: ClosedReportsQuery) {
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

  const [total, data] = await prisma.$transaction([
    prisma.relatorio.count({ where }),
    prisma.relatorio.findMany({
      where,
      include: {
        _count: {
          select: {
            itens: true,
          },
        },
      },
      orderBy: {
        dataRelatorio: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

export async function getReportByIdService(relatorioId: number) {
  const relatorio = await prisma.relatorio.findUnique({
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

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  return relatorio;
}

function parseNullableString(value?: string): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export async function createRelatorioItemService(
  relatorioId: number,
  payload: RelatorioItemEditableInput,
  user: AuthenticatedUser,
) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id: relatorioId },
  });

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  if (relatorio.status === "FECHADO") {
    throw new AppError("Relatório fechado. Não é possível adicionar itens.", 409, "REPORT_CLOSED");
  }

  return prisma.relatorioItem.create({
    data: {
      relatorioId: relatorio.id,
      usuarioId: user.id,
      perfilPessoa: payload.perfilPessoa,
      empresa: payload.empresa.trim(),
      placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
      nome: payload.nome.trim(),
      horaEntrada: parseNullableString(payload.horaEntrada),
      horaSaida: parseNullableString(payload.horaSaida),
      observacoes: parseNullableString(payload.observacoes),
      turno: user.turno,
    },
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
  });
}

async function getManagedItem(relatorioId: number, itemId: number) {
  const item = await prisma.relatorioItem.findUnique({
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

  if (!item || item.relatorioId !== relatorioId) {
    throw new AppError("Item do relatório não encontrado", 404, "ITEM_NOT_FOUND");
  }

  return item;
}

function assertCanManageItem(user: AuthenticatedUser, itemUserId: number, status: string) {
  if (status === "FECHADO") {
    throw new AppError("Relatório fechado. Não é possível alterar itens.", 409, "REPORT_CLOSED");
  }

  const isOwner = user.id === itemUserId;
  const isAdmin = user.perfil === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Sem permissão para alterar item de outro usuário", 403, "FORBIDDEN_ITEM_OWNER");
  }
}

export async function updateRelatorioItemService(
  relatorioId: number,
  itemId: number,
  payload: RelatorioItemEditableInput,
  user: AuthenticatedUser,
) {
  const item = await getManagedItem(relatorioId, itemId);

  assertCanManageItem(user, item.usuarioId, item.relatorio.status);

  return prisma.relatorioItem.update({
    where: { id: item.id },
    data: {
      perfilPessoa: payload.perfilPessoa,
      empresa: payload.empresa.trim(),
      placaVeiculo: payload.placaVeiculo.trim().toUpperCase(),
      nome: payload.nome.trim(),
      horaEntrada: parseNullableString(payload.horaEntrada),
      horaSaida: parseNullableString(payload.horaSaida),
      observacoes: parseNullableString(payload.observacoes),
    },
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
  });
}

export async function deleteRelatorioItemService(
  relatorioId: number,
  itemId: number,
  user: AuthenticatedUser,
) {
  const item = await getManagedItem(relatorioId, itemId);

  assertCanManageItem(user, item.usuarioId, item.relatorio.status);

  await prisma.relatorioItem.delete({
    where: { id: item.id },
  });

  return { ok: true };
}

export async function closeRelatorioService(relatorioId: number) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id: relatorioId },
  });

  if (!relatorio) {
    throw new AppError("Relatório não encontrado", 404, "REPORT_NOT_FOUND");
  }

  if (relatorio.status === "FECHADO") {
    return relatorio;
  }

  return prisma.relatorio.update({
    where: { id: relatorio.id },
    data: {
      status: "FECHADO",
      finalizadoEm: new Date(),
    },
  });
}

