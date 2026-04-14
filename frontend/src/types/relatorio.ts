import type { UsuarioResumo } from "./usuario";

export type PerfilPessoa =
  | "VISITANTE"
  | "FORNECEDOR"
  | "PRESTADOR"
  | "PARCEIRO"
  | "COLABORADOR"
  | "AGREGADO";

export interface RelatorioItem {
  id: number;
  relatorioId: number;
  usuarioId: number;
  perfilPessoa: PerfilPessoa;
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada: string | null;
  horaSaida: string | null;
  observacoes: string | null;
  turno: string | null;
  criadoEm: string;
  usuario?: UsuarioResumo;
}

export interface RelatorioItemEditableFields {
  perfilPessoa: PerfilPessoa;
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada?: string;
  horaSaida?: string;
  observacoes?: string;
}

export interface Relatorio {
  id: number;
  dataRelatorio: string;
  status: "ABERTO" | "FECHADO";
  criadoEm: string;
  finalizadoEm: string | null;
  itens: RelatorioItem[];
}

export interface RelatorioResumo {
  id: number;
  dataRelatorio: string;
  status: "ABERTO" | "FECHADO";
  criadoEm: string;
  finalizadoEm: string | null;
  _count?: {
    itens: number;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ClosedReportsFilters {
  page?: number;
  pageSize?: number;
  data?: string;
  busca?: string;
}

export interface RelatorioClockSnapshot {
  nowIso: string;
  businessDateKey: string;
  msToMidnight: number;
  minutesToMidnight: number;
  showCountdown: boolean;
  simulationEnabled: boolean;
  simulationStart: string | null;
}
