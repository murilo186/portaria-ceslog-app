import { fecharRelatorio } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { FeedbackState } from "../types";

type UseRelatorioCloseActionParams = {
  token: string | null;
  relatorioId: number | null;
  isReadOnly: boolean;
  setRelatorioStatus: Dispatch<SetStateAction<"ABERTO" | "FECHADO">>;
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
};

export function useRelatorioCloseAction({
  token,
  relatorioId,
  isReadOnly,
  setRelatorioStatus,
  setFeedback,
  setIsSubmitting,
}: UseRelatorioCloseActionParams) {
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const handleOpenCloseModal = () => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    setIsCloseModalOpen(true);
  };

  const handleCloseCloseModal = () => {
    setIsCloseModalOpen(false);
  };

  const handleConfirmClose = async () => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const closed = await fecharRelatorio(relatorioId, token);
      setRelatorioStatus(closed.status);
      setIsCloseModalOpen(false);
      setFeedback({ type: "success", message: "Relatório fechado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Não foi possível fechar o relatório."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isCloseModalOpen,
    handleOpenCloseModal,
    handleCloseCloseModal,
    handleConfirmClose,
  };
}
