import { getAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { getRelatorioHoje, listRelatorios } from "../../services/relatorioService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import type { RelatorioResumo } from "../../types/relatorio";

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [openReport, setOpenReport] = useState<RelatorioResumo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    async function loadOpenReport() {
      setIsLoadingStatus(true);
      setErrorMessage(null);

      try {
        const relatorios = await listRelatorios(authSession.token);
        const report = relatorios.find((item) => item.status === "ABERTO") ?? null;
        setOpenReport(report);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Não foi possível carregar o status do relatório"));
      } finally {
        setIsLoadingStatus(false);
      }
    }

    void loadOpenReport();
  }, [navigate]);

  const hasOpenReport = openReport !== null;

  const handleCreateReport = async () => {
    const auth = getAuthSession();

    if (!auth) {
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
      await getRelatorioHoje(auth.token);
      navigate("/relatorio");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error, "Não foi possível criar o relatório"));
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleContinueReport = async () => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    if (!hasOpenReport) {
      setErrorMessage("Não existe relatório em aberto no momento.");
      return;
    }

    setIsLoadingAction(true);
    setErrorMessage(null);

    try {
      await getRelatorioHoje(auth.token);
      navigate("/relatorio");
    } catch (error) {
      setErrorMessage(getUserErrorMessage(error, "Não foi possível abrir o relatório em aberto"));
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Dashboard</h1>
          <p className="text-sm text-text-700">Acompanhe o relatório diário da portaria.</p>
          {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
        </div>

        <Button onClick={() => void handleCreateReport()} disabled={isLoadingAction || isLoadingStatus || hasOpenReport}>
          {isLoadingAction ? "Abrindo..." : "Novo relatório"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-900">Relatório em aberto</h2>

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

          <Button
            variant="secondary"
            onClick={() => void handleContinueReport()}
            disabled={isLoadingAction || isLoadingStatus || !hasOpenReport}
          >
            Continuar relatório do dia
          </Button>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-text-900">Registros por data</h2>
            <p className="mt-1 text-sm text-text-700">Lista os relatórios fechados e permite abrir o detalhe.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/registros")}>Ver registros</Button>
        </Card>
      </div>
    </div>
  );
}
