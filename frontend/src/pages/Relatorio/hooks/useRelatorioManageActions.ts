import { deleteRelatorioItem, updateRelatorioItem } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useState, type FormEvent } from "react";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import { buildQuickSetSaidaPayload, initialFormValues, mapItemToFormValues } from "./relatorioPageHelpers";
import type { RelatorioManageContext } from "./relatorioItemActions.types";

export function useRelatorioManageActions({
  token,
  relatorioId,
  isReadOnly,
  setItens,
  canManageItem,
  setFeedback,
  setIsSubmitting,
}: RelatorioManageContext) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);

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

  return {
    isEditModalOpen,
    editFormValues,
    setEditFormValues,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditSubmit,
    handleDelete,
    handleQuickSetSaida,
  };
}