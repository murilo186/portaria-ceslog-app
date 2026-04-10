import { useCallback, useMemo, useState } from "react";
import type { RelatorioItem } from "../../../types/relatorio";
import type { FeedbackState } from "../types";
import { getAutorLabel } from "./relatorioPageHelpers";
import { useRelatorioBootstrap } from "./useRelatorioBootstrap";
import { useRelatorioClock } from "./useRelatorioClock";
import { useRelatorioItemActions } from "./useRelatorioItemActions";

export function useRelatorioPage() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const showSimulationControls = import.meta.env.DEV;

  const {
    itens,
    setItens,
    relatorioId,
    relatorioStatus,
    setRelatorioStatus,
    turnoAtual,
    usuarioLogado,
    token,
    isLoading,
  } = useRelatorioBootstrap({ setFeedback });

  const { countdownMinutes, countdownSeconds, clockSimulationStart, startSimulation, defaultSimulationStart } =
    useRelatorioClock({
      token,
      relatorioId,
      relatorioStatus,
      setRelatorioStatus,
      setFeedback,
    });

  const isReadOnly = relatorioStatus === "FECHADO";

  const canManageItem = useCallback((item: RelatorioItem): boolean => {
    if (!usuarioLogado) {
      return false;
    }

    if (usuarioLogado.perfil === "ADMIN") {
      return true;
    }

    return item.usuarioId === usuarioLogado.id;
  }, [usuarioLogado]);

  const sortedItens = useMemo(() => {
    return [...itens].sort((a, b) => b.id - a.id);
  }, [itens]);

  const {
    isSubmitting,
    formValues,
    setFormValues,
    handleCreateSubmit,
    handleCreateFormKeyDown,
    handleQuickSetSaida,
    handleOpenEditModal,
    handleDelete,
    isEditModalOpen,
    editFormValues,
    setEditFormValues,
    handleCloseEditModal,
    handleEditSubmit,
    handleSimulateClockStart,
  } = useRelatorioItemActions({
    token,
    relatorioId,
    isReadOnly,
    setItens,
    canManageItem,
    setFeedback,
    startSimulation,
    defaultSimulationStart,
  });

  const getAutorLabelForItem = useCallback(
    (item: RelatorioItem) => getAutorLabel(item, usuarioLogado),
    [usuarioLogado],
  );

  return {
    showSimulationControls,
    isSubmitting,
    isLoading,
    isReadOnly,
    relatorioStatus,
    turnoAtual,
    usuarioNome: usuarioLogado?.nome ?? null,
    countdownMinutes,
    countdownSeconds,
    clockSimulationStart,
    feedback,
    formValues,
    setFormValues,
    handleCreateSubmit,
    handleCreateFormKeyDown,
    sortedItens,
    canManageItem,
    handleQuickSetSaida,
    handleOpenEditModal,
    handleDelete,
    getAutorLabelForItem,
    isEditModalOpen,
    editFormValues,
    setEditFormValues,
    handleCloseEditModal,
    handleEditSubmit,
    handleSimulateClockStart,
  };
}
