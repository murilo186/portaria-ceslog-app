import Button from "../../../components/Button";
import FeedbackMessage from "../../../components/FeedbackMessage";
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

      <h1 className="text-2xl font-semibold text-text-900">Relatorio do Dia</h1>
      <p className="text-sm text-text-700">Cadastro integrado ao backend.</p>
      <p className="text-xs text-text-700">Turno aplicado automaticamente: {turnoAtual}</p>
      {usuarioNome ? <p className="text-xs text-text-700">Autor automatico: {usuarioNome}</p> : null}
      <p className="text-xs text-text-700">Campos obrigatorios: empresa, placa, nome e perfil.</p>
      {countdownMinutes !== null && countdownSeconds !== null ? (
        <p className="text-sm font-semibold text-amber-700">
          Fechamento automatico em {countdownMinutes} min {String(countdownSeconds).padStart(2, "0")} s.
        </p>
      ) : null}
      {clockSimulationStart ? (
        <p className="text-xs text-amber-700">Simulacao de horario ativa no backend: inicio em {clockSimulationStart}.</p>
      ) : null}
      {isReadOnly ? <p className="text-sm font-semibold text-amber-700">Relatorio fechado: somente leitura.</p> : null}

      {feedback ? <FeedbackMessage message={feedback.message} tone={feedback.type} /> : null}
    </div>
  );
}