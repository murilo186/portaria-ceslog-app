import { verifyToken } from "../lib/jwt";
import { AppError } from "./errorMiddleware";
import type { NextFunction, Request, Response } from "express";
import { TokenExpiredError } from "jsonwebtoken";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Não autenticado", 401, "AUTH_REQUIRED"));
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = verifyToken(token);

    req.user = {
      id: payload.sub,
      perfil: payload.perfil,
      nome: payload.nome,
      usuario: payload.usuario,
      email: payload.email,
      turno: payload.turno,
    };

    return next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return next(new AppError("Sessão expirada. Faça login novamente.", 401, "TOKEN_EXPIRED"));
    }

    return next(new AppError("Token inválido", 401, "TOKEN_INVALID"));
  }
}

