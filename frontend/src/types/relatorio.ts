export interface RelatorioItem {
  id: string;
  relatorioId: string;
  descricao: string;
  turno: string;
  horario: string;
  usuarioId: string;
  criadoEm: string;
}

export interface Relatorio {
  id: string;
  data: string;
  finalizado: boolean;
  criadoEm: string;
  itens: RelatorioItem[];
}
