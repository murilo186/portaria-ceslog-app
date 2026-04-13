type ClosedReportsKeyFilters = {
  page: number;
  pageSize: number;
  data: string;
  busca: string;
};

export const queryKeys = {
  openReport: (usuarioId: number) => ["relatorios", "aberto", usuarioId] as const,
  adminUsers: (usuarioId: number) => ["admin", "usuarios", usuarioId] as const,
  adminLogs: (usuarioId: number, limit: number) => ["admin", "logs", usuarioId, limit] as const,
  adminClosedReports: (usuarioId: number, pageSize: number) =>
    ["admin", "registros-fechados", usuarioId, pageSize] as const,
  closedReports: (filters: ClosedReportsKeyFilters) => ["registros", "fechados", filters] as const,
  reportDetail: (relatorioId: number) => ["registros", "detalhe", relatorioId] as const,
};
