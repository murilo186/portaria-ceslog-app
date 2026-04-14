import type { PerfilUsuario, TurnoUsuario } from "@prisma/client";

export type LoginInput = {
  usuario: string;
  senha: string;
};

export type AuthTokenPayload = {
  sub: number;
  tenantId: number;
  tenantSlug: string;
  tenantNome: string;
  perfil: PerfilUsuario;
  nome: string;
  usuario: string | null;
  email: string | null;
  turno: TurnoUsuario | null;
  sessionId: string;
};

export type AuthenticatedUser = {
  id: number;
  tenantId: number;
  tenantSlug: string;
  tenantNome: string;
  perfil: PerfilUsuario;
  nome: string;
  usuario: string | null;
  email: string | null;
  turno: TurnoUsuario | null;
};
