import { deleteRelatorioItem, updateRelatorioItem } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useCallback } from "react";
import type { RelatorioItem } from "../../../types/relatorio";
import { buildQuickSetSaidaPayload } from "./relatorioPageHelpers";
import type { RelatorioManageContext } from "./relatorioItemActions.types";
import { useRelatorioEditActions } from "./useRelatorioEditActions";

export function useRelatorioManageActions({
  token,
  relatorioId,
  isReadOnly,
  setItens,
  canManageItem,
  setFeedback,
  setIsSubmitting,
}: RelatorioManageContext) {
  const editActions = useRelatorioEditActions({
    token,
    relatorioId,
    isReadOnly,
    setItens,
    canManageItem,
    setFeedback,
    setIsSubmitting,
  });

  const canMutateItem = useCallback(
    (item: RelatorioItem): boolean => {
      if (!canManageItem(item)) {
        setFeedback({ type: "error", message: "Voce so pode editar registros da sua autoria." });
        return false;
      }

      return true;
    },
    [canManageItem, setFeedback],
  );

  const handleDelete = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly || !canMutateItem(item)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await deleteRelatorioItem(relatorioId, item.id, token);
      setItens((prevItens) => prevItens.filter((currentItem) => currentItem.id !== item.id));
      if (editActions.editingItemId === item.id) {
        editActions.handleCloseEditModal();
      }
      setFeedback({ type: "success", message: "Registro excluido com sucesso." });
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
    if (!token || !relatorioId || isReadOnly || !canMutateItem(item)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = buildQuickSetSaidaPayload(item);
      const updatedItem = await updateRelatorioItem(relatorioId, item.id, payload, token);
      setItens((prevItens) => prevItens.map((currentItem) => (currentItem.id === item.id ? updatedItem : currentItem)));
      setFeedback({ type: "success", message: "Saida atualizada com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar horario de saida"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEditModalOpen: editActions.isEditModalOpen,
    editFormValues: editActions.editFormValues,
    setEditFormValues: editActions.setEditFormValues,
    handleOpenEditModal: editActions.handleOpenEditModal,
    handleCloseEditModal: editActions.handleCloseEditModal,
    handleEditSubmit: editActions.handleEditSubmit,
    handleDelete,
    handleQuickSetSaida,
  };
}
