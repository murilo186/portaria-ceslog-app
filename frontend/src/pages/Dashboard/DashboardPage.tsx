import { getAuthSession } from "../../services/authStorage";
import { ApiError } from "../../services/api";
import { getUserErrorMessage } from "../../services/errorService";
import { createNovoRelatorio, getRelatorioAberto } from "../../services/relatorioService";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import type { Relatorio } from "../../types/relatorio";

type DashboardLocationState = {
  message?: string;
  authMessage?: string;
};

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function DashboardPage() {
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
          setErrorMessage(getUserErrorMessage(error, "Nao foi possivel carregar o status do relatorio"));
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
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    if (hasOpenReport) {
      setErrorMessage("Ja existe um relatorio em aberto. Continue o relatorio atual.");
      return;
    }

    setIsLoadingAction(true);
    setErrorMessage(null);

    try {
      await createNovoRelatorio(auth.token);
      navigate("/relatorio");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error, "Nao foi possivel criar o relatorio"));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleContinueReport = () => {
    if (!hasOpenReport) {
      setErrorMessage("Nao existe relatorio em aberto no momento.");
      return;
    }

    navigate("/relatorio");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Painel do Operador</h1>
          <p className="text-sm text-text-700">Controle rápido do relatório do turno.</p>
          {locationState?.message ? <p className="mt-2 text-sm text-amber-700">{locationState.message}</p> : null}
          {locationState?.authMessage ? <p className="mt-2 text-sm text-amber-700">{locationState.authMessage}</p> : null}
          {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="rounded-md border border-surface-200 bg-surface-50 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-700">Turno atual</p>
            <p className="text-sm text-text-900">
              {turnoAtual} {usuarioAtual ? `· ${usuarioAtual}` : ""}
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-900">Relatório do dia</h2>

            {isLoadingStatus ? (
              <p className="text-sm text-text-700">Carregando status...</p>
            ) : hasOpenReport ? (
              <>
                <p className="text-sm text-text-700">Data: {formatDate(openReport.dataRelatorio)}</p>
                <div>
                  <StatusBadge status={openReport.status} />
                </div>
              </>
            ) : (
              <p className="text-sm text-text-700">Nenhum relatório em aberto.</p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => void handleCreateReport()}
              disabled={isLoadingAction || isLoadingStatus || hasOpenReport}
              className="w-full sm:w-auto"
            >
              {isLoadingAction ? "Abrindo..." : "Novo relatorio"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleContinueReport}
              disabled={isLoadingAction || isLoadingStatus || !hasOpenReport}
              className="w-full sm:w-auto"
            >
              Continuar relatorio do dia
            </Button>
          </div>
          <p className="text-xs text-text-700">
            {hasOpenReport
              ? "Relatório em andamento: use continuar para seguir com os registros."
              : "Sem relatório aberto: crie um novo para iniciar os registros."}
          </p>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Registros por data</h2>
            <p className="mt-1 text-sm text-text-700">Lista os relatorios fechados e permite abrir o detalhe.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/registros")}>Ver registros</Button>
        </Card>

      </div>
    </div>
  );
}
