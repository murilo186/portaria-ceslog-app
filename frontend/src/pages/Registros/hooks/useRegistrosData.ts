import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { getCachedValue, setCachedValue } from "../../../services/requestCache";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import type { PaginatedResponse, PaginationMeta, RelatorioResumo } from "../../../types/relatorio";

type UseRegistrosDataParams = {
  appliedDateFilter: string;
  appliedSearchFilter: string;
  meta: PaginationMeta;
  setMeta: Dispatch<SetStateAction<PaginationMeta>>;
};

const REGISTROS_CACHE_TTL_MS = 20_000;

function getRegistrosCacheKey(appliedDateFilter: string, appliedSearchFilter: string, page: number, pageSize: number) {
  return `registros:fechados:${page}:${pageSize}:${appliedDateFilter}:${appliedSearchFilter}`;
}

export function useRegistrosData({ appliedDateFilter, appliedSearchFilter, meta, setMeta }: UseRegistrosDataParams) {
  const navigate = useNavigate();
  const [registrosFechados, setRegistrosFechados] = useState<RelatorioResumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;
    const cacheKey = getRegistrosCacheKey(appliedDateFilter, appliedSearchFilter, meta.page, meta.pageSize);
    const cached = getCachedValue<PaginatedResponse<RelatorioResumo>>(cacheKey);

    if (cached) {
      setRegistrosFechados(cached.data);
      setMeta(cached.meta);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

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
        setCachedValue(cacheKey, response, REGISTROS_CACHE_TTL_MS);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Erro ao carregar registros"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadRegistros();
  }, [appliedDateFilter, appliedSearchFilter, meta.page, meta.pageSize, navigate, setMeta]);

  return {
    registrosFechados,
    isLoading,
    errorMessage,
  };
}
