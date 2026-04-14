import type { TenantInfo } from "./tenant";

export type TurnoUsuario = "MANHA" | "TARDE";

export interface UsuarioResumo {
  id: number;
  nome: string;
  usuario: string | null;
  email: string | null;
  perfil: "ADMIN" | "OPERADOR";
  turno: TurnoUsuario | null;
}

export interface Usuario extends UsuarioResumo {
  tenant: TenantInfo;
}

export interface UsuarioAdminListItem extends UsuarioResumo {
  ativo: boolean;
  criadoEm: string;
}

export interface UsuarioCreateInput {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
}

export interface AuditLogItem {
  id: number;
  usuarioId: number | null;
  usuarioNome: string | null;
  usuarioLogin: string | null;
  acao: string;
  entidade: string;
  entidadeId: number | null;
  descricao: string;
  detalhes: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  criadoEm: string;
  usuario: {
    id: number;
    nome: string;
    usuario: string | null;
    perfil: "ADMIN" | "OPERADOR";
  } | null;
}
