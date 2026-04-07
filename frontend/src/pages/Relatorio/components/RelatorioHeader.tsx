import Button from "../../../components/Button";
import StatusBadge from "../../../components/StatusBadge";
import type { FeedbackState } from "../types";

type RelatorioHeaderProps = {
  showSimulationControls: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  isReadOnly: boolean;
  onSimulateClockStart: () => void;
  relatorioStatus: "ABERTO" | "FECHADO";
  turnoAtual: string;
  usuarioNome: string | null;
  countdownMinutes: number | null;
  countdownSeconds: number | null;
  clockSimulationStart: string | null;
  feedback: FeedbackState | null;
};

export default function RelatorioHeader({
  showSimulationControls,
  isSubmitting,
  isLoading,
  isReadOnly,
  onSimulateClockStart,
  relatorioStatus,
  turnoAtual,
  usuarioNome,
  countdownMinutes,
  countdownSeconds,
  clockSimulationStart,
  feedback,
}: RelatorioHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {showSimulationControls ? (
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2 text-xs"
            onClick={onSimulateClockStart}
            disabled={isSubmitting || isLoading || isReadOnly}
          >
            Simular 23:58
          </Button>
        ) : null}
        <StatusBadge status={relatorioStatus} />
      </div>

      <h1 className="text-2xl font-semibold text-text-900">Relatório do Dia</h1>
      <p className="text-sm text-text-700">Cadastro integrado ao backend.</p>
      <p className="text-xs text-text-700">Turno aplicado automaticamente: {turnoAtual}</p>
      {usuarioNome ? <p className="text-xs text-text-700">Autor automático: {usuarioNome}</p> : null}
      <p className="text-xs text-text-700">Campos obrigatórios: empresa, placa, nome e perfil.</p>
      {countdownMinutes !== null && countdownSeconds !== null ? (
        <p className="text-sm font-semibold text-amber-700">
          Fechamento automático em {countdownMinutes} min {String(countdownSeconds).padStart(2, "0")} s.
        </p>
      ) : null}
      {clockSimulationStart ? (
        <p className="text-xs text-amber-700">Simulação de horário ativa no backend: início em {clockSimulationStart}.</p>
      ) : null}
      {isReadOnly ? <p className="text-sm font-semibold text-amber-700">Relatório fechado: somente leitura.</p> : null}

      {feedback ? (
        <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
