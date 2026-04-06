import type { PerfilUsuario, TurnoUsuario } from "@prisma/client";

export type LoginInput = {
  usuario: string;
  senha: string;
};

export type AuthTokenPayload = {
  sub: number;
  perfil: PerfilUsuario;
  nome: string;
  usuario: string | null;
  email: string | null;
  turno: TurnoUsuario | null;
};

export type AuthenticatedUser = {
  id: number;
  perfil: PerfilUsuario;
  nome: string;
  usuario: string | null;
  email: string | null;
  turno: TurnoUsuario | null;
};
