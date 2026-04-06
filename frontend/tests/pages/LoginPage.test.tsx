import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const loginMock = vi.fn();
const saveAuthSessionMock = vi.fn();
const getAuthSessionMock = vi.fn();

vi.mock("../../src/services/authService", () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

vi.mock("../../src/services/authStorage", () => ({
  getAuthSession: () => getAuthSessionMock(),
  saveAuthSession: (...args: unknown[]) => saveAuthSessionMock(...args),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

import LoginPage from "../../src/pages/Login/LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSessionMock.mockReturnValue(null);
  });

  it("realiza login com sucesso e redireciona para dashboard", async () => {
    loginMock.mockResolvedValue({
      token: "jwt.token",
      usuario: {
        id: 1,
        nome: "Operador",
        email: "operador@ceslog.local",
        perfil: "OPERADOR",
        turno: "MANHA",
      },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "operador@ceslog.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({ email: "operador@ceslog.local", senha: "123456" });
    });

    expect(saveAuthSessionMock).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
  });
});
