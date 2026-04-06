export type RelatorioItemEditableInput = {
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

