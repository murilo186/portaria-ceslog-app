import { ApiError } from "./api";

const STATUS_MESSAGE_MAP: Record<number, string> = {
  401: "Sessão expirada ou inválida. Faça login novamente.",
  403: "Você não tem permissão para executar esta ação.",
  404: "Recurso não encontrado.",
  409: "Conflito de estado. Atualize a página e tente novamente.",
  422: "Dados inválidos. Revise os campos e tente novamente.",
  500: "Erro interno. Tente novamente em instantes.",
};

export function getUserErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return STATUS_MESSAGE_MAP[error.status] ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

