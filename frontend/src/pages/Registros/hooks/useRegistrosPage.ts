import { useMemo, useState } from "react";
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

  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialMeta.pageSize);

  const filtros = useRegistrosFilters({
    page,
    setPage,
    searchParams,
    setSearchParams: (next) => setSearchParams(next, { replace: true }),
  });

  const { registrosFechados, meta: remoteMeta, isLoading, isFetching, errorMessage } = useRegistrosData({
    appliedDateFilter: filtros.appliedDateFilter,
    appliedSearchFilter: filtros.appliedSearchFilter,
    page,
    pageSize,
  });

  const meta = useMemo<PaginationMeta>(() => {
    return {
      page: remoteMeta.page,
      pageSize: remoteMeta.pageSize,
      total: remoteMeta.total,
      totalPages: remoteMeta.totalPages,
    };
  }, [remoteMeta.page, remoteMeta.pageSize, remoteMeta.total, remoteMeta.totalPages]);

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
    isFetching,
    errorMessage,
    handleApplyFilters: filtros.handleApplyFilters,
    handleClearFilters: filtros.handleClearFilters,
    handleChangePage: filtros.handleChangePage,
    handleOpenDetail,
  };
}
