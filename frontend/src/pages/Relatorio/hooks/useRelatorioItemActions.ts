import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { RelatorioItem } from "../../../types/relatorio";
import type { FeedbackState } from "../types";
import { useRelatorioCloseAction } from "./useRelatorioCloseAction";
import { useRelatorioCreateAction } from "./useRelatorioCreateAction";
import { useRelatorioManageActions } from "./useRelatorioManageActions";
import { useRelatorioSimulationAction } from "./useRelatorioSimulationAction";

type UseRelatorioItemActionsParams = {
  token: string | null;
  relatorioId: number | null;
  isReadOnly: boolean;
  setRelatorioStatus: Dispatch<SetStateAction<"ABERTO" | "FECHADO">>;
  setItens: Dispatch<SetStateAction<RelatorioItem[]>>;
  canManageItem: (item: RelatorioItem) => boolean;
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
  startSimulation: (start?: string) => Promise<unknown>;
  defaultSimulationStart: string;
};

export function useRelatorioItemActions({
  token,
  relatorioId,
  isReadOnly,
  setRelatorioStatus,
  setItens,
  canManageItem,
  setFeedback,
  startSimulation,
  defaultSimulationStart,
}: UseRelatorioItemActionsParams) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createAction = useRelatorioCreateAction({
    token,
    relatorioId,
    isReadOnly,
    setItens,
    setFeedback,
    setIsSubmitting,
  });

  const manageActions = useRelatorioManageActions({
    token,
    relatorioId,
    isReadOnly,
    setItens,
    canManageItem,
    setFeedback,
    setIsSubmitting,
  });

  const simulationAction = useRelatorioSimulationAction({
    token,
    relatorioId,
    isReadOnly,
    startSimulation,
    defaultSimulationStart,
    setFeedback,
    setIsSubmitting,
  });

  const closeAction = useRelatorioCloseAction({
    token,
    relatorioId,
    isReadOnly,
    setRelatorioStatus,
    setFeedback,
    setIsSubmitting,
  });

  return {
    isSubmitting,
    formValues: createAction.formValues,
    setFormValues: createAction.setFormValues,
    handleCreateSubmit: createAction.handleCreateSubmit,
    handleCreateFormKeyDown: createAction.handleCreateFormKeyDown,
    handleQuickSetSaida: manageActions.handleQuickSetSaida,
    handleOpenEditModal: manageActions.handleOpenEditModal,
    handleDelete: manageActions.handleDelete,
    isEditModalOpen: manageActions.isEditModalOpen,
    editFormValues: manageActions.editFormValues,
    setEditFormValues: manageActions.setEditFormValues,
    handleCloseEditModal: manageActions.handleCloseEditModal,
    handleEditSubmit: manageActions.handleEditSubmit,
    handleSimulateClockStart: simulationAction.handleSimulateClockStart,
    isCloseModalOpen: closeAction.isCloseModalOpen,
    handleOpenCloseModal: closeAction.handleOpenCloseModal,
    handleCloseCloseModal: closeAction.handleCloseCloseModal,
    handleConfirmClose: closeAction.handleConfirmClose,
  };
}
