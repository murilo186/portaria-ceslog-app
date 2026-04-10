import { updateRelatorioItem } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import { initialFormValues, mapItemToFormValues } from "./relatorioPageHelpers";
import type { RelatorioManageContext } from "./relatorioItemActions.types";

type UseRelatorioEditActionsResult = {
  isEditModalOpen: boolean;
  editingItemId: number | null;
  editFormValues: RelatorioItemEditableFields;
  setEditFormValues: Dispatch<SetStateAction<RelatorioItemEditableFields>>;
  handleOpenEditModal: (item: RelatorioItem) => void;
  handleCloseEditModal: () => void;
  handleEditSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function useRelatorioEditActions({
  token,
  relatorioId,
  isReadOnly,
  setItens,
  canManageItem,
  setFeedback,
  setIsSubmitting,
}: RelatorioManageContext): UseRelatorioEditActionsResult {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);

  const handleOpenEditModal = (item: RelatorioItem) => {
    if (isReadOnly) {
      setFeedback({ type: "error", message: "Relatorio fechado. Edicao indisponivel." });
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Voce so pode editar registros da sua autoria." });
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

  return {
    isEditModalOpen,
    editingItemId,
    editFormValues,
    setEditFormValues,
    handleOpenEditModal,
    handleCloseEditModal,
    handleEditSubmit,
  };
}
