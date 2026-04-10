import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PaginationMeta } from "../../../types/relatorio";
import { initialMeta, parseInitialFilters } from "./registrosPageHelpers";
import { useRegistrosData } from "./useRegistrosData";
import { useRegistrosFilters } from "./useRegistrosFilters";

export { formatDate } from "./registrosPageHelpers";

export function useRegistrosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { initialPage } = parseInitialFilters(searchParams);

  const [meta, setMeta] = useState<PaginationMeta>({
    ...initialMeta,
    page: initialPage,
  });

  const filtros = useRegistrosFilters({
    meta,
    setMeta: (updater) => setMeta((prev) => updater(prev)),
    searchParams,
    setSearchParams: (next) => setSearchParams(next, { replace: true }),
  });

  const { registrosFechados, isLoading, errorMessage } = useRegistrosData({
    appliedDateFilter: filtros.appliedDateFilter,
    appliedSearchFilter: filtros.appliedSearchFilter,
    meta,
    setMeta,
  });

  const handleOpenDetail = (relatorioId: number) => {
    navigate(filtros.buildDetailPath(relatorioId));
  };

  return {
    registrosFechados,
    meta,
    dateFilter: filtros.dateFilter,
    setDateFilter: filtros.setDateFilter,
    searchFilter: filtros.searchFilter,
    setSearchFilter: filtros.setSearchFilter,
    appliedSearchFilter: filtros.appliedSearchFilter,
    isLoading,
    errorMessage,
    handleApplyFilters: filtros.handleApplyFilters,
    handleClearFilters: filtros.handleClearFilters,
    handleChangePage: filtros.handleChangePage,
    handleOpenDetail,
  };
}
