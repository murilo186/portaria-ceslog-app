import { useState } from "react";
import { parseInitialFilters } from "./registrosPageHelpers";

type UseRegistrosFiltersParams = {
  page: number;
  setPage: (nextPage: number) => void;
  searchParams: URLSearchParams;
  setSearchParams: (nextInit: URLSearchParams) => void;
};

export function useRegistrosFilters({ page, setPage, searchParams, setSearchParams }: UseRegistrosFiltersParams) {
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

    setPage(1);
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
    setPage(1);
    updateSearchParams({ page: 1 });
  };

  const handleChangePage = (nextPage: number) => {
    setPage(nextPage);

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

    if (page > 1) {
      params.set("page", String(page));
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
