import { createAuditLog } from "../services/auditService";
import {
  createUsuarioService,
  deleteUsuarioService,
  listUsuariosService,
  updateUsuarioSenhaService,
} from "../services/usuarioService";
import { getRequestMetadata } from "../utils/requestMetadata";
import {
  createUsuarioSchema,
  deleteUsuarioParamsSchema,
  updateSenhaSchema,
} from "../validation/usuarioSchemas";
import { asyncHandler } from "./helpers/asyncHandler";
import { ensureAuthenticatedUser } from "./helpers/ensureAuthenticatedUser";

export const listUsuariosController = asyncHandler(async (_req, res) => {
  const usuarios = await listUsuariosService();
  return res.status(200).json(usuarios);
});

export const createUsuarioController = asyncHandler(async (req, res) => {
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
});

export const deleteUsuarioController = asyncHandler(async (req, res) => {
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
});

export const updateUsuarioSenhaController = asyncHandler(async (req, res) => {
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
});
