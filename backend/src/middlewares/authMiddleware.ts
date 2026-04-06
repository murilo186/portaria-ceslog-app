import { verifyToken } from "../lib/jwt";
import { AppError } from "./errorMiddleware";
import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Nao autenticado", 401));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyToken(token);

    req.user = {
      id: payload.sub,
      perfil: payload.perfil,
      nome: payload.nome,
      email: payload.email,
      turno: payload.turno,
    };

    return next();
  } catch (_error) {
    return next(new AppError("Token invalido", 401));
  }
}
