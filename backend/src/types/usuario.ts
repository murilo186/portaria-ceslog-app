import type { PerfilUsuario, TurnoUsuario } from "@prisma/client";

export type AdminUsuarioListItem = {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: PerfilUsuario;
  turno: TurnoUsuario | null;
  ativo: boolean;
  criadoEm: Date;
};

export type CreateUsuarioInput = {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
};
