export type TurnoUsuario = "MANHA" | "TARDE";

export interface Usuario {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: "ADMIN" | "OPERADOR";
  turno: TurnoUsuario | null;
}

export interface UsuarioAdminListItem {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: "ADMIN" | "OPERADOR";
  turno: TurnoUsuario | null;
  ativo: boolean;
  criadoEm: string;
}

export interface UsuarioCreateInput {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
}
