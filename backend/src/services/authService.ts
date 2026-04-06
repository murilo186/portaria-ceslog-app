import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import type { LoginInput } from "../types/auth";
import { AppError } from "../middlewares/errorMiddleware";
import bcrypt from "bcryptjs";

export async function loginService(input: LoginInput) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email.toLowerCase().trim() },
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
    email: usuario.email,
    turno: usuario.turno,
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      turno: usuario.turno,
    },
  };
}

