import { createRelatorioItem } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import type { RelatorioItemEditableFields } from "../../../types/relatorio";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import { getCurrentTime, initialFormValues } from "./relatorioPageHelpers";
import type { RelatorioMutationContext } from "./relatorioItemActions.types";

export function useRelatorioCreateAction({
  token,
  relatorioId,
  isReadOnly,
  setItens,
  setFeedback,
  setIsSubmitting,
}: RelatorioMutationContext) {
  const [formValues, setFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);

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

  return {
    formValues,
    setFormValues,
    handleCreateSubmit,
    handleCreateFormKeyDown,
  };
}