import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
import { createNovoRelatorio, getRelatorioAberto } from "../../../services/relatorioService";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Relatorio } from "../../../types/relatorio";

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

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [openReport, setOpenReport] = useState<Relatorio | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;
    const userIsAdmin = authSession.usuario.perfil === "ADMIN";

    if (userIsAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    async function loadOpenReport() {
      setIsLoadingStatus(true);
      setErrorMessage(null);

      try {
        const report = await getRelatorioAberto(authSession.token);
        setOpenReport(report);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          setOpenReport(null);
        } else {
          setErrorMessage(getUserErrorMessage(error, "Não foi possível carregar o status do relatório"));
        }
      } finally {
        setIsLoadingStatus(false);
      }
    }

    void loadOpenReport();
  }, [navigate]);

  const locationState = (location.state as DashboardLocationState | null) ?? null;
  const hasOpenReport = openReport !== null;
  const auth = getAuthSession();
  const turnoAtual = auth?.usuario.turno ?? "-";
  const usuarioAtual = auth?.usuario.nome ?? "";

  const handleCreateReport = async () => {
    const authSession = getAuthSession();

    if (!authSession) {
      navigate("/");
      return;
    }

    if (hasOpenReport) {
      setErrorMessage("Já existe um relatório em aberto. Continue o relatório atual.");
      return;
    }

    setIsLoadingAction(true);
    setErrorMessage(null);

    try {
      await createNovoRelatorio(authSession.token);
      navigate("/relatorio");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error, "Não foi possível criar o relatório"));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleContinueReport = () => {
    if (!hasOpenReport) {
      setErrorMessage("Não existe relatório em aberto no momento.");
      return;
    }

    navigate("/relatorio");
  };

  const handleGoRegistros = () => {
    navigate("/registros");
  };

  return {
    isLoadingAction,
    isLoadingStatus,
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
