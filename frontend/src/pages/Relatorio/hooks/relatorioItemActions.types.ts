import type { Dispatch, SetStateAction } from "react";
import type { RelatorioItem } from "../../../types/relatorio";
import type { FeedbackState } from "../types";

export type RelatorioMutationContext = {
  token: string | null;
  relatorioId: number | null;
  isReadOnly: boolean;
  setItens: Dispatch<SetStateAction<RelatorioItem[]>>;
  setFeedback: Dispatch<SetStateAction<FeedbackState | null>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
};

export type RelatorioManageContext = RelatorioMutationContext & {
  canManageItem: (item: RelatorioItem) => boolean;
};