import type { StatusRelatorio } from "@prisma/client";
import type { AuthenticatedUser } from "../../types/auth";
import { RELATORIO_ERROR } from "./errors";

export function assertCanManageItem(user: AuthenticatedUser, itemUserId: number, status: StatusRelatorio) {
  if (status === "FECHADO") {
    throw RELATORIO_ERROR.reportClosed();
  }

  const isOwner = user.id === itemUserId;
  const isAdmin = user.perfil === "ADMIN";

  if (!isOwner && !isAdmin) {
    throw RELATORIO_ERROR.forbiddenItemOwner();
  }
}

export function getDateRange(data?: string): { gte: Date; lt: Date } | undefined {
  if (!data) {
    return undefined;
  }

  const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(data);

  if (!isIsoDate) {
    throw RELATORIO_ERROR.invalidDateFilter();
  }

  const start = new Date(`${data}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime())) {
    throw RELATORIO_ERROR.invalidDateFilter();
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    gte: start,
    lt: end,
  };
}
