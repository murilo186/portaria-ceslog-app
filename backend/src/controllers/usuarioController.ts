import { AppError } from "../middlewares/errorMiddleware";
import { createUsuarioService, deleteUsuarioService, listUsuariosService } from "../services/usuarioService";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

const createUsuarioSchema = z.object({
  nome: z.string().trim().min(1, "Nome e obrigatorio").max(120, "Nome deve ter ate 120 caracteres"),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, "Usuario invalido. Use 3 a 30 caracteres (a-z, 0-9, ponto, underline ou hifen)."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100, "Senha deve ter ate 100 caracteres"),
  turno: z.enum(["MANHA", "TARDE"]),
});

const deleteUsuarioParamsSchema = z.object({
  usuarioId: z.coerce.number().int().positive(),
});

function ensureAuthenticatedUser(req: Request) {
  if (!req.user) {
    throw new AppError("Nao autenticado", 401, "AUTH_REQUIRED");
  }

  return req.user;
}

export async function listUsuariosController(_req: Request, res: Response, next: NextFunction) {
  try {
    const usuarios = await listUsuariosService();
    return res.status(200).json(usuarios);
  } catch (error) {
    return next(error);
  }
}

export async function createUsuarioController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createUsuarioSchema.parse(req.body);
    const usuario = await createUsuarioService(payload);

    return res.status(201).json(usuario);
  } catch (error) {
    return next(error);
  }
}

export async function deleteUsuarioController(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = ensureAuthenticatedUser(req);
    const { usuarioId } = deleteUsuarioParamsSchema.parse(req.params);

    const result = await deleteUsuarioService(usuarioId, currentUser.id);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
