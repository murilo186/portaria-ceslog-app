import { useState } from "react";
import type { PaginationMeta } from "../../../types/relatorio";
import { parseInitialFilters } from "./registrosPageHelpers";

type UseRegistrosFiltersParams = {
  meta: PaginationMeta;
  setMeta: (updater: (prevMeta: PaginationMeta) => PaginationMeta) => void;
  searchParams: URLSearchParams;
  setSearchParams: (nextInit: URLSearchParams) => void;
};

export function useRegistrosFilters({ meta, setMeta, searchParams, setSearchParams }: UseRegistrosFiltersParams) {
  const { initialDateFilter, initialSearchFilter } = parseInitialFilters(searchParams);

  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [searchFilter, setSearchFilter] = useState(initialSearchFilter);
  const [appliedDateFilter, setAppliedDateFilter] = useState(initialDateFilter);
  const [appliedSearchFilter, setAppliedSearchFilter] = useState(initialSearchFilter.trim());

  const updateSearchParams = (next: { data?: string; busca?: string; page?: number }) => {
    const params = new URLSearchParams();

    if (next.data) {
      params.set("data", next.data);
    }

    if (next.busca) {
      params.set("busca", next.busca);
    }

    if (next.page && next.page > 1) {
      params.set("page", String(next.page));
    }

    setSearchParams(params);
  };

  const handleApplyFilters = () => {
    const normalizedSearch = searchFilter.trim();

    setMeta((prevMeta) => ({ ...prevMeta, page: 1 }));
    setAppliedDateFilter(dateFilter);
    setAppliedSearchFilter(normalizedSearch);
    updateSearchParams({
      data: dateFilter || undefined,
      busca: normalizedSearch || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setDateFilter("");
    setSearchFilter("");
    setAppliedDateFilter("");
    setAppliedSearchFilter("");
    setMeta((prevMeta) => ({ ...prevMeta, page: 1 }));
    updateSearchParams({ page: 1 });
  };

  const handleChangePage = (nextPage: number) => {
    setMeta((prevMeta) => ({
      ...prevMeta,
      page: nextPage,
    }));

    updateSearchParams({
      data: appliedDateFilter || undefined,
      busca: appliedSearchFilter || undefined,
      page: nextPage,
    });
  };

  const buildDetailPath = (relatorioId: number): string => {
    const params = new URLSearchParams();

    if (appliedDateFilter) {
      params.set("data", appliedDateFilter);
    }

    if (appliedSearchFilter) {
      params.set("busca", appliedSearchFilter);
    }

    if (meta.page > 1) {
      params.set("page", String(meta.page));
    }

    const queryString = params.toString();

    return `/registros/${relatorioId}${queryString ? `?${queryString}` : ""}`;
  };

  return {
    dateFilter,
    setDateFilter,
    searchFilter,
    setSearchFilter,
    appliedDateFilter,
    appliedSearchFilter,
    handleApplyFilters,
    handleClearFilters,
    handleChangePage,
    buildDetailPath,
  };
}
