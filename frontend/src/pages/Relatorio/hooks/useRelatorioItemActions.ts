import {
  createRelatorioItem,
  deleteRelatorioItem,
  updateRelatorioItem,
} from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useState, type Dispatch, type FormEvent, type KeyboardEvent, type SetStateAction } from "react";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import type { FeedbackState } from "../types";
import {
  buildQuickSetSaidaPayload,
  getCurrentTime,
  initialFormValues,
  mapItemToFormValues,
} from "./relatorioPageHelpers";

type UseRelatorioItemActionsParams = {
  token: string | null;
  relatorioId: number | null;
  isReadOnly: boolean;
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
  setItens,
  canManageItem,
  setFeedback,
  startSimulation,
  defaultSimulationStart,
}: UseRelatorioItemActionsParams) {
  const [formValues, setFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    const normalizedPayload = normalizeRelatorioPayload(formValues);
    const payloadToCreate: RelatorioItemEditableFields = {
      ...normalizedPayload,
      horaEntrada: normalizedPayload.horaEntrada?.trim() ? normalizedPayload.horaEntrada : getCurrentTime(),
    };
    const errors = validateRelatorioPayload(payloadToCreate);

    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" ") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const createdItem = await createRelatorioItem(relatorioId, payloadToCreate, token);
      setItens((prevItens) => [createdItem, ...prevItens]);
      setFormValues(initialFormValues);
      setFeedback({ type: "success", message: "Registro adicionado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao criar item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.tagName !== "TEXTAREA") {
      return;
    }

    event.preventDefault();
    event.currentTarget.requestSubmit();
  };

  const handleOpenEditModal = (item: RelatorioItem) => {
    if (isReadOnly) {
      setFeedback({ type: "error", message: "Relatório fechado. Edição indisponível." });
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode editar registros da sua autoria." });
      return;
    }

    setEditingItemId(item.id);
    setEditFormValues(mapItemToFormValues(item));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
    setEditFormValues(initialFormValues);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || editingItemId === null || isReadOnly) {
      return;
    }

    const normalizedPayload = normalizeRelatorioPayload(editFormValues);
    const errors = validateRelatorioPayload(normalizedPayload);

    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" ") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedItem = await updateRelatorioItem(relatorioId, editingItemId, normalizedPayload, token);
      setItens((prevItens) => prevItens.map((item) => (item.id === editingItemId ? updatedItem : item)));
      handleCloseEditModal();
      setFeedback({ type: "success", message: "Registro atualizado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode excluir registros da sua autoria." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await deleteRelatorioItem(relatorioId, item.id, token);
      setItens((prevItens) => prevItens.filter((currentItem) => currentItem.id !== item.id));
      if (editingItemId === item.id) {
        handleCloseEditModal();
      }
      setFeedback({ type: "success", message: "Registro excluído com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao excluir item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSetSaida = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode editar registros da sua autoria." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = buildQuickSetSaidaPayload(item);
      const updatedItem = await updateRelatorioItem(relatorioId, item.id, payload, token);
      setItens((prevItens) => prevItens.map((currentItem) => (currentItem.id === item.id ? updatedItem : currentItem)));
      setFeedback({ type: "success", message: "Saída atualizada com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar horário de saída"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
  };
}
