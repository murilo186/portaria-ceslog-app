import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";

const fecharRelatorioMock = vi.fn();

vi.mock("../../src/services/relatorioService", () => ({
  fecharRelatorio: (...args: unknown[]) => fecharRelatorioMock(...args),
}));

import { useRelatorioCloseAction } from "../../src/pages/Relatorio/hooks/useRelatorioCloseAction";
import type { FeedbackState } from "../../src/pages/Relatorio/types";

describe("useRelatorioCloseAction", () => {
  it("executa fluxo manual de fechamento com modal, confirmação e readonly", async () => {
    fecharRelatorioMock.mockResolvedValue({
      id: 99,
      status: "FECHADO",
    });

    const { result } = renderHook(() => {
      const [status, setStatus] = useState<"ABERTO" | "FECHADO">("ABERTO");
      const [feedback, setFeedback] = useState<FeedbackState | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);

      const action = useRelatorioCloseAction({
        token: "jwt.token",
        relatorioId: 99,
        isReadOnly: status === "FECHADO",
        setRelatorioStatus: setStatus,
        setFeedback,
        setIsSubmitting,
      });

      return {
        status,
        feedback,
        isSubmitting,
        ...action,
      };
    });

    expect(result.current.isCloseModalOpen).toBe(false);

    act(() => {
      result.current.handleOpenCloseModal();
    });

    expect(result.current.isCloseModalOpen).toBe(true);

    await act(async () => {
      await result.current.handleConfirmClose();
    });

    expect(fecharRelatorioMock).toHaveBeenCalledWith(99, "jwt.token");
    expect(result.current.status).toBe("FECHADO");
    expect(result.current.feedback?.type).toBe("success");
    expect(result.current.feedback?.message).toBe("Relatório fechado com sucesso.");
    expect(result.current.isCloseModalOpen).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
  });
});
