export type PerfilPessoa =
  | "VISITANTE"
  | "FORNECEDOR"
  | "PRESTADOR"
  | "PARCEIRO"
  | "COLABORADOR"
  | "AGREGADO";

export type RelatorioItemEditableInput = {
  perfilPessoa: PerfilPessoa;
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada?: string;
  horaSaida?: string;
  observacoes?: string;
};

export type ClosedReportsQuery = {
  page: number;
  pageSize: number;
  data?: string;
  busca?: string;
};

export type ReportItemsCursorQuery = {
  itemCursor?: number;
  itemLimit: number;
};


