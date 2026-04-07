import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, useDashboardPage } from "./hooks/useDashboardPage";

export default function DashboardPage() {
  const {
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
  } = useDashboardPage();

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
            ) : hasOpenReport && openReport ? (
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
              {isLoadingAction ? "Abrindo..." : "Novo relatório"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleContinueReport}
              disabled={isLoadingAction || isLoadingStatus || !hasOpenReport}
              className="w-full sm:w-auto"
            >
              Continuar relatório do dia
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
            <p className="mt-1 text-sm text-text-700">Lista os relatórios fechados e permite abrir o detalhe.</p>
          </div>
          <Button variant="secondary" onClick={handleGoRegistros}>
            Ver registros
          </Button>
        </Card>
      </div>
    </div>
  );
}
