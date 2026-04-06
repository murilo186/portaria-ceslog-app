import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import type { LoginInput } from "../types/auth";
import { AppError } from "../middlewares/errorMiddleware";
import bcrypt from "bcryptjs";

function normalizeUsuario(value: string): string {
  return value.trim();
}

export async function loginService(input: LoginInput) {
  const usuarioInformado = normalizeUsuario(input.usuario).toLowerCase();

  const usuario = await prisma.usuario.findFirst({
    where: { usuario: usuarioInformado },
  });

  if (!usuario || !usuario.ativo) {
    throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
  }

  const senhaValida = await bcrypt.compare(input.senha, usuario.senhaHash);

  if (!senhaValida) {
    throw new AppError("Credenciais inválidas", 401, "INVALID_CREDENTIALS");
  }

  const token = signToken({
    sub: usuario.id,
    perfil: usuario.perfil,
    nome: usuario.nome,
    usuario: usuario.usuario,
    email: usuario.email,
    turno: usuario.turno,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      usuario: usuario.usuario,
      email: usuario.email,
      perfil: usuario.perfil,
      turno: usuario.turno,
    },
  };
}

