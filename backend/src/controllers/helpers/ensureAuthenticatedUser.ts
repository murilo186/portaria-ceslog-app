import { AppError } from "../../middlewares/errorMiddleware";
import type { AuthenticatedUser } from "../../types/auth";
import type { Request } from "express";

export function ensureAuthenticatedUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw new AppError("Nao autenticado", 401, "AUTH_REQUIRED");
  }

  return req.user;
}
