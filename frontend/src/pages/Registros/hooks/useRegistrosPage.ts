import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PaginationMeta, RelatorioResumo } from "../../../types/relatorio";

export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const initialMeta: PaginationMeta = {
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 1,
};

export function useRegistrosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialDateFilter = searchParams.get("data") ?? "";
  const initialSearchFilter = searchParams.get("busca") ?? "";
  const initialPageParam = Number(searchParams.get("page") ?? "1");
  const initialPage = Number.isFinite(initialPageParam) && initialPageParam > 0 ? initialPageParam : 1;

  const [registrosFechados, setRegistrosFechados] = useState<RelatorioResumo[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    ...initialMeta,
    page: initialPage,
  });

  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [searchFilter, setSearchFilter] = useState(initialSearchFilter);
  const [appliedDateFilter, setAppliedDateFilter] = useState(initialDateFilter);
  const [appliedSearchFilter, setAppliedSearchFilter] = useState(initialSearchFilter.trim());

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    async function loadRegistros() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await listRelatoriosFechados(authSession.token, {
          page: meta.page,
          pageSize: meta.pageSize,
          data: appliedDateFilter || undefined,
          busca: appliedSearchFilter || undefined,
        });

        setRegistrosFechados(response.data);
        setMeta(response.meta);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Erro ao carregar registros"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadRegistros();
  }, [appliedDateFilter, appliedSearchFilter, meta.page, meta.pageSize, navigate]);

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

  const handleOpenDetail = (relatorioId: number) => {
    navigate(buildDetailPath(relatorioId));
  };

  return {
    registrosFechados,
    meta,
    dateFilter,
    setDateFilter,
    searchFilter,
    setSearchFilter,
    appliedSearchFilter,
    isLoading,
    errorMessage,
    handleApplyFilters,
    handleClearFilters,
    handleChangePage,
    handleOpenDetail,
  };
}
