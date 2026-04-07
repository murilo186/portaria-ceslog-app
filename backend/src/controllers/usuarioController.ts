import { AppError } from "../middlewares/errorMiddleware";
import { createAuditLog } from "../services/auditService";
import {
  createUsuarioService,
  deleteUsuarioService,
  listUsuariosService,
  updateUsuarioSenhaService,
} from "../services/usuarioService";
import { getRequestMetadata } from "../utils/requestMetadata";
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

const updateSenhaSchema = z.object({
  novaSenha: z.string().min(6, "Senha deve ter ao menos 6 caracteres").max(100, "Senha deve ter ate 100 caracteres"),
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
    const currentUser = ensureAuthenticatedUser(req);
    const payload = createUsuarioSchema.parse(req.body);
    const usuario = await createUsuarioService(payload);

    await createAuditLog({
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      usuarioLogin: currentUser.usuario,
      acao: "USUARIO_CRIADO",
      entidade: "USUARIO",
      entidadeId: usuario.id,
      descricao: "Usuario operador criado na area administrativa.",
      detalhes: {
        usuario: usuario.usuario,
        nome: usuario.nome,
        turno: usuario.turno,
      },
      contexto: getRequestMetadata(req),
    });

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

    await createAuditLog({
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      usuarioLogin: currentUser.usuario,
      acao: "USUARIO_INATIVADO",
      entidade: "USUARIO",
      entidadeId: usuarioId,
      descricao: "Usuario operador inativado na area administrativa.",
      contexto: getRequestMetadata(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateUsuarioSenhaController(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUser = ensureAuthenticatedUser(req);
    const { usuarioId } = deleteUsuarioParamsSchema.parse(req.params);
    const { novaSenha } = updateSenhaSchema.parse(req.body);

    const result = await updateUsuarioSenhaService(usuarioId, currentUser.id, novaSenha);

    await createAuditLog({
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
      usuarioLogin: currentUser.usuario,
      acao: "USUARIO_SENHA_ATUALIZADA",
      entidade: "USUARIO",
      entidadeId: usuarioId,
      descricao: "Senha do operador atualizada pela administracao.",
      contexto: getRequestMetadata(req),
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
