import type { PaginationMeta } from "../../../types/relatorio";

export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export const initialMeta: PaginationMeta = {
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 1,
};

export function parseInitialFilters(searchParams: URLSearchParams) {
  const initialDateFilter = searchParams.get("data") ?? "";
  const initialSearchFilter = searchParams.get("busca") ?? "";
  const initialPageParam = Number(searchParams.get("page") ?? "1");
  const initialPage = Number.isFinite(initialPageParam) && initialPageParam > 0 ? initialPageParam : 1;

  return {
    initialDateFilter,
    initialSearchFilter,
    initialPage,
  };
}