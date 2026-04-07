import { AppError } from "../middlewares/errorMiddleware";
import { prisma } from "../lib/prisma";
import type { CreateUsuarioInput } from "../types/usuario";
import bcrypt from "bcryptjs";

const usuarioRegex = /^[a-z0-9._-]{3,30}$/;

function normalizeUsuario(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeNome(value: string): string {
  return value.trim();
}

function buildInternalEmail(usuario: string): string {
  return `${usuario}@usuario.local`;
}

export async function listUsuariosService() {
  return prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      usuario: true,
      email: true,
      perfil: true,
      turno: true,
      ativo: true,
      criadoEm: true,
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

export async function createUsuarioService(input: CreateUsuarioInput) {
  const nome = normalizeNome(input.nome);
  const usuario = normalizeUsuario(input.usuario);

  if (!usuarioRegex.test(usuario)) {
    throw new AppError(
      "Usuario invalido. Use 3 a 30 caracteres (a-z, 0-9, ponto, underline ou hifen).",
      400,
      "INVALID_USERNAME",
    );
  }

  const existente = await prisma.usuario.findFirst({
    where: {
      usuario,
    },
    select: {
      id: true,
    },
  });

  if (existente) {
    throw new AppError("Usuario ja cadastrado.", 409, "USERNAME_ALREADY_EXISTS");
  }

  const senhaHash = await bcrypt.hash(input.senha, 10);

  return prisma.usuario.create({
    data: {
      nome,
      usuario,
      email: buildInternalEmail(usuario),
      senhaHash,
      perfil: "OPERADOR",
      turno: input.turno,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      usuario: true,
      email: true,
      perfil: true,
      turno: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

export async function deleteUsuarioService(usuarioId: number, currentAdminId: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      perfil: true,
      ativo: true,
    },
  });

  if (!usuario) {
    throw new AppError("Usuario nao encontrado.", 404, "USER_NOT_FOUND");
  }

  if (usuario.id === currentAdminId) {
    throw new AppError("Nao e permitido excluir o proprio usuario logado.", 409, "SELF_DELETE_BLOCKED");
  }

  if (usuario.perfil === "ADMIN") {
    throw new AppError("Nao e permitido excluir conta de administrador.", 409, "ADMIN_DELETE_BLOCKED");
  }

  if (!usuario.ativo) {
    return { ok: true };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      ativo: false,
    },
  });

  return { ok: true };
}

export async function updateUsuarioSenhaService(
  usuarioId: number,
  currentAdminId: number,
  novaSenha: string,
) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      perfil: true,
    },
  });

  if (!usuario) {
    throw new AppError("Usuario nao encontrado.", 404, "USER_NOT_FOUND");
  }

  if (usuario.id === currentAdminId) {
    throw new AppError("Use a alteracao de senha da propria conta.", 409, "SELF_PASSWORD_CHANGE_BLOCKED");
  }

  if (usuario.perfil === "ADMIN") {
    throw new AppError("Troca de senha permitida apenas para operadores.", 409, "ADMIN_PASSWORD_CHANGE_BLOCKED");
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      senhaHash,
    },
  });

  return { ok: true };
}
