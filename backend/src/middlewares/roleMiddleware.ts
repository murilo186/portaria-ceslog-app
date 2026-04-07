import { AppError } from "./errorMiddleware";
import type { NextFunction, Request, Response } from "express";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError("Nao autenticado", 401, "AUTH_REQUIRED"));
  }

  if (req.user.perfil !== "ADMIN") {
    return next(new AppError("Sem permissao para esta area", 403, "FORBIDDEN_ADMIN_ONLY"));
  }

  return next();
}
