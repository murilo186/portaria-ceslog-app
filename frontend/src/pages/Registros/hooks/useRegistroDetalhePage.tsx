import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { getRelatorioById } from "../../../services/relatorioService";
import type { AuthState } from "../../../types/auth";
import type { Relatorio } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { buildRegistroCsv, getAutor, getSearchStats, renderHighlightedText } from "./registroDetalheHelpers";

export { formatDate } from "./registroDetalheHelpers";

export function useRegistroDetalhePage() {
  const navigate = useNavigate();
  const { relatorioId } = useParams<{ relatorioId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = getAuthSession() as AuthState | null;

  const initialDateFilter = useMemo(() => searchParams.get("data") ?? "", [searchParams]);
  const initialSearchFilter = useMemo(() => searchParams.get("busca") ?? "", [searchParams]);

  const [dateFilter, setDateFilter] = useState(initialDateFilter);
  const [searchFilter, setSearchFilter] = useState(initialSearchFilter);
  const [appliedSearchFilter, setAppliedSearchFilter] = useState(initialSearchFilter.trim());

  const usuarioLogado: Usuario | null = auth?.usuario ?? null;

  const parsedRelatorioId = useMemo(() => {
    const parsed = Number(relatorioId);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  }, [relatorioId]);

  useEffect(() => {
    if (!auth || !relatorioId) {
      navigate("/");
    }
  }, [auth, navigate, relatorioId]);

  const relatorioQuery = useQuery<Relatorio>({
    queryKey: queryKeys.reportDetail(parsedRelatorioId ?? 0),
    enabled: Boolean(auth && parsedRelatorioId),
    queryFn: () => getRelatorioById(parsedRelatorioId as number, auth!.token),
    staleTime: 20_000,
  });

  const errorMessage = useMemo(() => {
    if (relatorioId && parsedRelatorioId === null) {
      return "Identificador de relatorio invalido.";
    }

    if (!relatorioQuery.error) {
      return null;
    }

    return getUserErrorMessage(relatorioQuery.error, "Erro ao carregar registro");
  }, [parsedRelatorioId, relatorioId, relatorioQuery.error]);

  const relatorio = relatorioQuery.data ?? null;
  const isAdmin = usuarioLogado?.perfil === "ADMIN";

  const searchStats = useMemo(() => {
    return getSearchStats(relatorio, usuarioLogado, appliedSearchFilter);
  }, [appliedSearchFilter, relatorio, usuarioLogado]);

  const handleApplyFilters = useCallback(() => {
    const normalizedSearch = searchFilter.trim();
    const params = new URLSearchParams();

    if (dateFilter) {
      params.set("data", dateFilter);
    }

    if (normalizedSearch) {
      params.set("busca", normalizedSearch);
    }

    params.set("page", "1");

    setAppliedSearchFilter(normalizedSearch);
    setSearchParams(params, { replace: true });
  }, [dateFilter, searchFilter, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setDateFilter("");
    setSearchFilter("");
    setAppliedSearchFilter("");
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleDownloadCsv = useCallback(() => {
    if (!relatorio) {
      return;
    }

    const csvContent = buildRegistroCsv(relatorio, usuarioLogado);
    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `registro-${relatorio.dataRelatorio.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [relatorio, usuarioLogado]);

  const getAutorLabel = useCallback(
    (item: Relatorio["itens"][number]) => getAutor(item, usuarioLogado),
    [usuarioLogado],
  );

  return {
    relatorio,
    isLoading: relatorioQuery.isLoading,
    errorMessage,
    isAdmin,
    searchStats,
    dateFilter,
    setDateFilter,
    searchFilter,
    setSearchFilter,
    appliedSearchFilter,
    handleApplyFilters,
    handleClearFilters,
    handleDownloadCsv,
    renderHighlightedText,
    getAutorLabel,
  };
}
