import { apiRequest } from "./api";
import type { Relatorio, RelatorioItem, RelatorioItemEditableFields } from "../types/relatorio";

export async function getRelatorioHoje(token: string): Promise<Relatorio> {
  return apiRequest<Relatorio>("/api/relatorios/hoje", { token });
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
