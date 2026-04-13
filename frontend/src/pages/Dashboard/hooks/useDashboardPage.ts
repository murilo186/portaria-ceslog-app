import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
import { createNovoRelatorio, getRelatorioAberto } from "../../../services/relatorioService";
import { queryKeys } from "../../../services/queryKeys";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type DashboardLocationState = {
  message?: string;
  authMessage?: string;
};

export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function useDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = getAuthSession();

  const authSession = useMemo(() => auth, [auth]);
  const userIsAdmin = authSession?.usuario.perfil === "ADMIN";

  useEffect(() => {
    if (!authSession) {
      navigate("/");
      return;
    }

    if (userIsAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [authSession, navigate, userIsAdmin]);

  const openReportQuery = useQuery({
    queryKey: queryKeys.openReport(authSession?.usuario.id ?? 0),
    enabled: Boolean(authSession && !userIsAdmin),
    queryFn: async () => {
      try {
        return await getRelatorioAberto(authSession!.token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }

        throw error;
      }
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!openReportQuery.error) {
      return;
    }

    setErrorMessage(getUserErrorMessage(openReportQuery.error, "NÃ£o foi possÃ­vel carregar o status do relatÃ³rio"));
  }, [openReportQuery.error]);

  const createReportMutation = useMutation({
    mutationFn: async () => {
      if (!authSession) {
        throw new ApiError("SessÃ£o expirada", 401);
      }

      return createNovoRelatorio(authSession.token);
    },
    onSuccess: (createdReport) => {
      if (!authSession) {
        return;
      }

      queryClient.setQueryData(queryKeys.openReport(authSession.usuario.id), createdReport);
      navigate("/relatorio");
    },
    onError: (error) => {
      setErrorMessage(getUserErrorMessage(error, "NÃ£o foi possÃ­vel criar o relatÃ³rio"));
    },
  });

  const locationState = (location.state as DashboardLocationState | null) ?? null;
  const openReport = openReportQuery.data ?? null;
  const hasOpenReport = openReport !== null;
  const turnoAtual = authSession?.usuario.turno ?? "-";
  const usuarioAtual = authSession?.usuario.nome ?? "";

  const handleCreateReport = async () => {
    if (!authSession) {
      navigate("/");
      return;
    }

    if (hasOpenReport) {
      setErrorMessage("JÃ¡ existe um relatÃ³rio em aberto. Continue o relatÃ³rio atual.");
      return;
    }

    setErrorMessage(null);
    await createReportMutation.mutateAsync();
  };

  const handleContinueReport = () => {
    if (!hasOpenReport) {
      setErrorMessage("NÃ£o existe relatÃ³rio em aberto no momento.");
      return;
    }

    navigate("/relatorio");
  };

  const handleGoRegistros = () => {
    navigate("/registros");
  };

  return {
    isLoadingAction: createReportMutation.isPending,
    isLoadingStatus: openReportQuery.isLoading,
    isRefreshingStatus: openReportQuery.isFetching && !openReportQuery.isLoading,
    openReport,
    errorMessage,
    locationState,
    hasOpenReport,
    turnoAtual,
    usuarioAtual,
    handleCreateReport,
    handleContinueReport,
    handleGoRegistros,
  };
}
