import { getUserErrorMessage } from "../../../services/errorService";
import type { Dispatch, SetStateAction } from "react";
import type { FeedbackState } from "../types";

type UseRelatorioSimulationActionParams = {
  token: string | null;
  relatorioId: number | null;
  isReadOnly: boolean;
  startSimulation: (start?: string) => Promise<unknown>;
  defaultSimulationStart: string;
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
};

export function useRelatorioSimulationAction({
  token,
  relatorioId,
  isReadOnly,
  startSimulation,
  defaultSimulationStart,
  setFeedback,
  setIsSubmitting,
}: UseRelatorioSimulationActionParams) {
  const handleSimulateClockStart = async () => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const snapshot = await startSimulation(defaultSimulationStart);

      if (!snapshot) {
        return;
      }

      setFeedback({
        type: "success",
        message: `Horário simulado ajustado para ${defaultSimulationStart}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Não foi possível ajustar o horário de simulação."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSimulateClockStart,
  };
}