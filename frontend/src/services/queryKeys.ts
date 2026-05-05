type ClosedReportsKeyFilters = {
  page: number;
  pageSize: number;
  data: string;
  busca: string;
};

export const queryKeys = {
  openReport: (tenantId: number, usuarioId: number) => ["relatorios", "aberto", tenantId, usuarioId] as const,
  adminUsers: (tenantId: number, usuarioId: number) => ["admin", "usuarios", tenantId, usuarioId] as const,
  adminLogs: (tenantId: number, usuarioId: number, limit: number) =>
    ["admin", "logs", tenantId, usuarioId, limit] as const,
  adminClosedReports: (tenantId: number, usuarioId: number, pageSize: number) =>
    ["admin", "registros-fechados", tenantId, usuarioId, pageSize] as const,
  closedReports: (filters: ClosedReportsKeyFilters) => ["registros", "fechados", filters] as const,
  reportDetail: (relatorioId: number) => ["registros", "detalhe", relatorioId] as const,
};
