import Button from "../../components/Button";
import Card from "../../components/Card";
import FeedbackMessage from "../../components/FeedbackMessage";
import Skeleton from "../../components/Skeleton";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, useDashboardPage } from "./hooks/useDashboardPage";

export default function DashboardPage() {
  const {
    isLoadingAction,
    isLoadingStatus,
    isRefreshingStatus,
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
    <div className="space-y-8" aria-busy={isLoadingStatus || isLoadingAction}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-900 sm:text-2xl">
            Bem-vindo{usuarioAtual ? `, ${usuarioAtual}` : ""}
          </h1>
          <p className="text-sm text-text-700">Controle rápido do relatório do turno. Turno: {turnoAtual}.</p>
          {locationState?.message ? <FeedbackMessage message={locationState.message} tone="warning" className="mt-2" /> : null}
          {locationState?.authMessage ? (
            <FeedbackMessage message={locationState.authMessage} tone="warning" className="mt-2" />
          ) : null}
          {errorMessage ? <FeedbackMessage message={errorMessage} tone="error" className="mt-2" /> : null}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-text-900">Relatório do dia</h2>
              {!isLoadingStatus && hasOpenReport && openReport ? <StatusBadge status={openReport.status} /> : null}
            </div>

            {isLoadingStatus ? (
              <div className="mt-1 space-y-2 py-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-24" />
              </div>
            ) : hasOpenReport && openReport ? (
              <>
                <p className="mt-1 text-sm text-text-700">Data: {formatDate(openReport.dataRelatorio)}</p>
                {isRefreshingStatus ? <p className="text-xs text-text-700">Atualizando status...</p> : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-text-700">Nenhum relatório em aberto.</p>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 md:gap-4">
            <Button
              onClick={() => void handleCreateReport()}
              disabled={isLoadingAction || isLoadingStatus || hasOpenReport}
              className="w-full"
            >
              {isLoadingAction ? "Abrindo..." : "Novo relatório"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleContinueReport}
              disabled={isLoadingAction || isLoadingStatus || !hasOpenReport}
              className="w-full"
            >
              Continuar relatório do dia
            </Button>
          </div>
          <p className="mt-3 text-sm text-text-700">
            {hasOpenReport
              ? "Relatório em andamento: use continuar para seguir com os registros."
              : "Sem relatório aberto: crie um novo para iniciar os registros."}
          </p>
        </Card>

        <Card>
          <div>
            <h2 className="text-lg font-semibold text-text-900">Registros por data</h2>
            <p className="mt-1 text-sm text-text-700">Lista os relatórios fechados e permite abrir o detalhe.</p>
          </div>
          <div className="mt-5">
            <Button variant="secondary" onClick={handleGoRegistros} className="w-full sm:w-auto">
            Ver registros
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
