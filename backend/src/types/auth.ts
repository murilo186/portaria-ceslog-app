import type { PerfilUsuario } from "@prisma/client";

export type LoginInput = {
  email: string;
  senha: string;
};

export type AuthTokenPayload = {
  sub: number;
  perfil: PerfilUsuario;
  nome: string;
  email: string;
  turno: string | null;
};

export type AuthenticatedUser = {
  id: number;
  perfil: PerfilUsuario;
  nome: string;
  email: string;
  turno: string | null;
};
