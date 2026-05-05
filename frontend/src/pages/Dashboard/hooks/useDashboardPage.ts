import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
import { createNovoRelatorio, getRelatorioAberto, getRelatorioHoje } from "../../../services/relatorioService";
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
    queryKey: queryKeys.openReport(authSession?.usuario.tenant.id ?? 0, authSession?.usuario.id ?? 0),
    enabled: Boolean(authSession && !userIsAdmin),
    queryFn: () => getRelatorioAberto(authSession!.token),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (!openReportQuery.error) {
      return;
    }

    setErrorMessage(getUserErrorMessage(openReportQuery.error, "Nao foi possivel carregar o status do relatorio"));
  }, [openReportQuery.error]);

  const createReportMutation = useMutation({
    mutationFn: async () => {
      if (!authSession) {
        throw new ApiError("Sessao expirada", 401);
      }

      return createNovoRelatorio(authSession.token);
    },
    onSuccess: (createdReport) => {
      if (!authSession) {
        return;
      }

      queryClient.setQueryData(queryKeys.openReport(authSession.usuario.tenant.id, authSession.usuario.id), createdReport);
      navigate("/relatorio");
    },
  });

  const locationState = (location.state as DashboardLocationState | null) ?? null;
  const openReport = openReportQuery.data ?? null;
  const hasOpenReport = openReport !== null;
  const turnoAtual = authSession?.usuario.turno ?? "-";
  const usuarioAtual = authSession?.usuario.nome ?? "";

  const handleDailyConflict = async () => {
    if (!authSession) {
      return;
    }

    const todayReport = await getRelatorioHoje(authSession.token);

    if (todayReport.status === "ABERTO") {
      queryClient.setQueryData(queryKeys.openReport(authSession.usuario.tenant.id, authSession.usuario.id), todayReport);
      navigate("/relatorio");
      return;
    }

    navigate(`/registros/${todayReport.id}`, {
      state: { message: "Relatorio do dia ja foi fechado. Consulte o detalhe em modo leitura." },
    });
  };

  const handleCreateReport = async () => {
    if (!authSession) {
      navigate("/");
      return;
    }

    if (hasOpenReport) {
      navigate("/relatorio");
      return;
    }

    setErrorMessage(null);

    try {
      await createReportMutation.mutateAsync();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        (error.code === "DAILY_REPORT_ALREADY_EXISTS" || error.code === "OPEN_REPORT_EXISTS")
      ) {
        try {
          await handleDailyConflict();
          return;
        } catch {
          setErrorMessage("Ja existe relatorio para hoje, mas nao foi possivel carregar automaticamente.");
          return;
        }
      }

      setErrorMessage(getUserErrorMessage(error, "Nao foi possivel criar o relatorio"));
    }
  };

  const handleContinueReport = () => {
    if (!hasOpenReport) {
      setErrorMessage("Nao existe relatorio em aberto no momento.");
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
