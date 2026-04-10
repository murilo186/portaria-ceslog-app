import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { getCachedValue, setCachedValue } from "../../../services/requestCache";
import { getRelatorioById } from "../../../services/relatorioService";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Relatorio } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { buildRegistroCsv, getAutor, getSearchStats, renderHighlightedText } from "./registroDetalheHelpers";

export { formatDate } from "./registroDetalheHelpers";

const REGISTRO_DETALHE_CACHE_TTL_MS = 20_000;

function getRegistroDetalheCacheKey(relatorioId: number) {
  return `registros:detalhe:${relatorioId}`;
}

export function useRegistroDetalhePage() {
  const navigate = useNavigate();
  const { relatorioId } = useParams<{ relatorioId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState(searchParams.get("data") ?? "");
  const [searchFilter, setSearchFilter] = useState(searchParams.get("busca") ?? "");
  const [appliedSearchFilter, setAppliedSearchFilter] = useState((searchParams.get("busca") ?? "").trim());

  useEffect(() => {
    const nextDateFilter = searchParams.get("data") ?? "";
    const nextSearchFilter = searchParams.get("busca") ?? "";

    setDateFilter(nextDateFilter);
    setSearchFilter(nextSearchFilter);
    setAppliedSearchFilter(nextSearchFilter.trim());
  }, [searchParams]);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth || !relatorioId) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setUsuarioLogado(authSession.usuario);

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const parsedId = Number(relatorioId);

        if (!Number.isFinite(parsedId)) {
          setErrorMessage("Identificador de relatorio invalido.");
          return;
        }

        const cacheKey = getRegistroDetalheCacheKey(parsedId);
        const cached = getCachedValue<Relatorio>(cacheKey);

        if (cached) {
          setRelatorio(cached);
          setIsLoading(false);
          return;
        }

        const detail = await getRelatorioById(parsedId, authSession.token);
        setRelatorio(detail);
        setCachedValue(cacheKey, detail, REGISTRO_DETALHE_CACHE_TTL_MS);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Erro ao carregar registro"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [navigate, relatorioId]);

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

    setSearchParams(params, { replace: true });
  }, [dateFilter, searchFilter, setSearchParams]);

  const handleClearFilters = useCallback(() => {
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
    isLoading,
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