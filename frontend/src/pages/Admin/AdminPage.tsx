import { getAuthSession } from "../../services/authStorage";
import { ApiError } from "../../services/api";
import { getUserErrorMessage } from "../../services/errorService";
import { getRelatorioAberto, listRelatoriosFechados } from "../../services/relatorioService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import type { Relatorio, RelatorioResumo } from "../../types/relatorio";

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export default function AdminPage() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<Relatorio | null>(null);
  const [closedReportsCount, setClosedReportsCount] = useState(0);
  const [latestClosedReports, setLatestClosedReports] = useState<RelatorioResumo[]>([]);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    if (auth.usuario.perfil !== "ADMIN") {
      navigate("/dashboard", {
        replace: true,
        state: { authMessage: "Voce nao tem permissao para acessar a area administrativa." },
      });
      return;
    }

    const authSession = auth;

    async function loadAdminSummary() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let currentOpenReport: Relatorio | null = null;

        try {
          currentOpenReport = await getRelatorioAberto(authSession.token);
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 404)) {
            throw error;
          }
        }

        const closedResponse = await listRelatoriosFechados(authSession.token, {
          page: 1,
          pageSize: 5,
        });

        setOpenReport(currentOpenReport);
        setClosedReportsCount(closedResponse.meta.total);
        setLatestClosedReports(closedResponse.data);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Nao foi possivel carregar os dados administrativos."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadAdminSummary();
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold text-text-900">Administracao</h1>
        <p className="text-sm text-text-700">Visao geral operacional e acesso as funcionalidades de gestao.</p>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-text-900">Relatorio atual</h2>

          {isLoading ? (
            <p className="text-sm text-text-700">Carregando status...</p>
          ) : openReport ? (
            <>
              <p className="text-sm text-text-700">Data: {formatDate(openReport.dataRelatorio)}</p>
              <StatusBadge status={openReport.status} />
            </>
          ) : (
            <p className="text-sm text-text-700">Nenhum relatorio em aberto no momento.</p>
          )}

          <Button type="button" variant="secondary" onClick={() => navigate("/relatorio")}>Continuar relatorio</Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base font-semibold text-text-900">Historico fechado</h2>
          {isLoading ? (
            <p className="text-sm text-text-700">Carregando total...</p>
          ) : (
            <p className="text-sm text-text-700">Total de relatorios fechados: {closedReportsCount}</p>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate("/registros")}>Abrir historico</Button>
        </Card>

        <Card className="space-y-3 md:col-span-2 xl:col-span-1">
          <h2 className="text-base font-semibold text-text-900">Atalhos administrativos</h2>
          <p className="text-sm text-text-700">Use os atalhos para navegar rapidamente pelas areas principais.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/registros")}>Registros</Button>
          </div>
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-text-900">Ultimos relatorios fechados</h2>

        {isLoading ? (
          <p className="text-sm text-text-700">Carregando lista...</p>
        ) : latestClosedReports.length === 0 ? (
          <p className="text-sm text-text-700">Ainda nao ha relatorios fechados.</p>
        ) : (
          <div className="divide-y divide-surface-200 rounded-md border border-surface-200">
            {latestClosedReports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => navigate(`/registros/${report.id}`)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-50"
              >
                <span className="text-sm font-medium text-text-900">REGISTRO - {formatDate(report.dataRelatorio)}</span>
                <span className="text-xs text-text-700">Itens: {report._count?.itens ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}