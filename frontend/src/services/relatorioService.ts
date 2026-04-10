import { z } from "zod";
import { apiRequestWithSchema } from "./api";
import {
  okResponseSchema,
  paginatedRelatorioResumoResponseSchema,
  relatorioClockSnapshotSchema,
  relatorioItemSchema,
  relatorioResumoSchema,
  relatorioSchema,
} from "./contracts";
import type {
  ClosedReportsFilters,
  PaginatedResponse,
  Relatorio,
  RelatorioClockSnapshot,
  RelatorioItem,
  RelatorioItemEditableFields,
  RelatorioResumo,
} from "../types/relatorio";

const relatorioResumoListSchema = z.array(relatorioResumoSchema);

export async function getRelatorioHoje(token: string): Promise<Relatorio> {
  return apiRequestWithSchema("/api/relatorios/hoje", relatorioSchema, { token });
}

export async function getRelatorioAberto(token: string): Promise<Relatorio> {
  return apiRequestWithSchema("/api/relatorios/aberto", relatorioSchema, { token });
}

export async function getRelatorioClock(token: string): Promise<RelatorioClockSnapshot> {
  return apiRequestWithSchema(`/api/relatorios/relogio?t=${Date.now()}`, relatorioClockSnapshotSchema, { token });
}

export async function setRelatorioClockSimulation(
  start: string | null,
  token: string,
): Promise<RelatorioClockSnapshot> {
  return apiRequestWithSchema("/api/relatorios/relogio/simulacao", relatorioClockSnapshotSchema, {
    method: "POST",
    body: { start },
    token,
  });
}

export async function createNovoRelatorio(token: string): Promise<Relatorio> {
  return apiRequestWithSchema("/api/relatorios/novo", relatorioSchema, {
    method: "POST",
    token,
  });
}

export async function listRelatorios(token: string): Promise<RelatorioResumo[]> {
  return apiRequestWithSchema("/api/relatorios", relatorioResumoListSchema, { token });
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

  return apiRequestWithSchema(`/api/relatorios/fechados${queryString ? `?${queryString}` : ""}`, paginatedRelatorioResumoResponseSchema, {
    token,
  });
}

export async function getRelatorioById(relatorioId: number, token: string): Promise<Relatorio> {
  return apiRequestWithSchema(`/api/relatorios/${relatorioId}`, relatorioSchema, { token });
}

export async function createRelatorioItem(
  relatorioId: number,
  payload: RelatorioItemEditableFields,
  token: string,
): Promise<RelatorioItem> {
  return apiRequestWithSchema(`/api/relatorios/${relatorioId}/itens`, relatorioItemSchema, {
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
  return apiRequestWithSchema(`/api/relatorios/${relatorioId}/itens/${itemId}`, relatorioItemSchema, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deleteRelatorioItem(relatorioId: number, itemId: number, token: string): Promise<void> {
  await apiRequestWithSchema(`/api/relatorios/${relatorioId}/itens/${itemId}`, okResponseSchema, {
    method: "DELETE",
    token,
  });
}

export async function fecharRelatorio(relatorioId: number, token: string): Promise<Relatorio> {
  return apiRequestWithSchema(`/api/relatorios/${relatorioId}/fechar`, relatorioSchema, {
    method: "POST",
    token,
  });
}
