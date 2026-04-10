import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import type { AuthState } from "../../../types/auth";
import type { PaginationMeta, RelatorioResumo } from "../../../types/relatorio";

type UseRegistrosDataParams = {
  appliedDateFilter: string;
  appliedSearchFilter: string;
  page: number;
  pageSize: number;
};

const EMPTY_META: PaginationMeta = {
  page: 1,
  pageSize: 8,
  total: 0,
  totalPages: 1,
};

export function useRegistrosData({ appliedDateFilter, appliedSearchFilter, page, pageSize }: UseRegistrosDataParams) {
  const navigate = useNavigate();
  const auth = getAuthSession() as AuthState | null;

  useEffect(() => {
    if (!auth) {
      navigate("/");
    }
  }, [auth, navigate]);

  const query = useQuery({
    queryKey: queryKeys.closedReports({
      page,
      pageSize,
      data: appliedDateFilter,
      busca: appliedSearchFilter,
    }),
    enabled: Boolean(auth),
    queryFn: () =>
      listRelatoriosFechados(auth!.token, {
        page,
        pageSize,
        data: appliedDateFilter || undefined,
        busca: appliedSearchFilter || undefined,
      }),
    staleTime: 20_000,
  });

  return {
    registrosFechados: (query.data?.data ?? []) as RelatorioResumo[],
    meta: query.data?.meta ?? { ...EMPTY_META, page, pageSize },
    isLoading: query.isLoading,
    errorMessage: query.error ? getUserErrorMessage(query.error, "Erro ao carregar registros") : null,
  };
}
