import { apiRequest } from "./api";
import type {
  ClosedReportsFilters,
  PaginatedResponse,
  Relatorio,
  RelatorioItem,
  RelatorioItemEditableFields,
  RelatorioResumo,
} from "../types/relatorio";

export async function getRelatorioHoje(token: string): Promise<Relatorio> {
  return apiRequest<Relatorio>("/api/relatorios/hoje", { token });
}

export async function listRelatorios(token: string): Promise<RelatorioResumo[]> {
  return apiRequest<RelatorioResumo[]>("/api/relatorios", { token });
}

export async function listRelatoriosFechados(
  token: string,
  filters: ClosedReportsFilters,
): Promise<PaginatedResponse<RelatorioResumo>> {
  const query = new URLSearchParams();

  if (filters.page) {
    query.set("page", String(filters.page));
  }

  if (filters.pageSize) {
    query.set("pageSize", String(filters.pageSize));
  }

  if (filters.data) {
    query.set("data", filters.data);
  }

  if (filters.busca) {
    query.set("busca", filters.busca);
  }

  const queryString = query.toString();

  return apiRequest<PaginatedResponse<RelatorioResumo>>(
    `/api/relatorios/fechados${queryString ? `?${queryString}` : ""}`,
    { token },
  );
}

export async function getRelatorioById(relatorioId: number, token: string): Promise<Relatorio> {
  return apiRequest<Relatorio>(`/api/relatorios/${relatorioId}`, { token });
}

export async function createRelatorioItem(
  relatorioId: number,
  payload: RelatorioItemEditableFields,
  token: string,
): Promise<RelatorioItem> {
  return apiRequest<RelatorioItem>(`/api/relatorios/${relatorioId}/itens`, {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateRelatorioItem(
  relatorioId: number,
  itemId: number,
  payload: RelatorioItemEditableFields,
  token: string,
): Promise<RelatorioItem> {
  return apiRequest<RelatorioItem>(`/api/relatorios/${relatorioId}/itens/${itemId}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deleteRelatorioItem(relatorioId: number, itemId: number, token: string): Promise<void> {
  await apiRequest<{ ok: true }>(`/api/relatorios/${relatorioId}/itens/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export async function fecharRelatorio(relatorioId: number, token: string): Promise<Relatorio> {
  return apiRequest<Relatorio>(`/api/relatorios/${relatorioId}/fechar`, {
    method: "POST",
    token,
  });
}

