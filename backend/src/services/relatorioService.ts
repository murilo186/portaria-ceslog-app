import { AppError } from "../middlewares/errorMiddleware";
import { prisma } from "../lib/prisma";
import { getBusinessDateKey, reportDateFromKey } from "../utils/date";
import type { AuthenticatedUser } from "../types/auth";
import type { RelatorioItemEditableInput } from "../types/relatorio";

async function ensureTodayReport() {
  const todayKey = getBusinessDateKey();
  const todayDate = reportDateFromKey(todayKey);

  await prisma.relatorio.updateMany({
    where: {
      status: "ABERTO",
      dataRelatorio: {
        lt: todayDate,
      },
    },
    data: {
      status: "FECHADO",
      finalizadoEm: new Date(),
    },
  });

  const relatorio = await prisma.relatorio.upsert({
    where: { dataRelatorio: todayDate },
    update: {},
    create: {
      dataRelatorio: todayDate,
      status: "ABERTO",
    },
    include: {
      itens: {
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
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

  return relatorio;
}

export async function getTodayReportService() {
  return ensureTodayReport();
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
    throw new AppError("Relatorio nao encontrado", 404);
  }

  return relatorio;
}

function parseNullableString(value?: string): string | null {
  if (!value) return null;
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
    throw new AppError("Relatorio nao encontrado", 404);
  }

  if (relatorio.status === "FECHADO") {
    throw new AppError("Relatorio fechado. Nao e possivel adicionar itens.", 409);
  }

  return prisma.relatorioItem.create({
    data: {
      relatorioId: relatorio.id,
      usuarioId: user.id,
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
          email: true,
          perfil: true,
          turno: true,
        },
      },
    },
  });

  if (!item || item.relatorioId !== relatorioId) {
    throw new AppError("Item do relatorio nao encontrado", 404);
  }

  return item;
}

function assertCanManageItem(user: AuthenticatedUser, itemUserId: number, status: string) {
  if (status === "FECHADO") {
    throw new AppError("Relatorio fechado. Nao e possivel alterar itens.", 409);
  }

  const isOwner = user.id === itemUserId;
  const isAdmin = user.perfil === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Sem permissao para alterar item de outro usuario", 403);
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
    throw new AppError("Relatorio nao encontrado", 404);
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
