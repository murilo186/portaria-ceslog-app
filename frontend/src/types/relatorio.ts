export interface RelatorioItem {
  id: number;
  relatorioId: number;
  usuarioId: number;
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada: string | null;
  horaSaida: string | null;
  observacoes: string | null;
  turno: string | null;
  criadoEm: string;
}

export interface RelatorioItemEditableFields {
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada: string;
  horaSaida: string;
  observacoes: string;
}

export interface Relatorio {
  id: number;
  dataRelatorio: string;
  status: string;
  criadoEm: string;
  finalizadoEm: string | null;
  itens: RelatorioItem[];
}
