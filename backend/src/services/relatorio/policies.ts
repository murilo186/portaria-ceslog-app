import { AppError } from "../../middlewares/errorMiddleware";
import type { AuthenticatedUser } from "../../types/auth";
import type { StatusRelatorio } from "@prisma/client";

export function assertCanManageItem(user: AuthenticatedUser, itemUserId: number, status: StatusRelatorio) {
  if (status === "FECHADO") {
    throw new AppError("Relatório fechado. Não é possível alterar itens.", 409, "REPORT_CLOSED");
  }

  const isOwner = user.id === itemUserId;
  const isAdmin = user.perfil === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw new AppError("Sem permissão para alterar item de outro usuário", 403, "FORBIDDEN_ITEM_OWNER");
  }
}

export function getDateRange(data?: string): { gte: Date; lt: Date } | undefined {
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
