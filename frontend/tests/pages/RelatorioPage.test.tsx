import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockNavigate = vi.fn();
const getAuthSessionMock = vi.fn();
const getRelatorioAbertoMock = vi.fn();
const createRelatorioItemMock = vi.fn();
const updateRelatorioItemMock = vi.fn();
const deleteRelatorioItemMock = vi.fn();
const fecharRelatorioMock = vi.fn();

vi.mock("../../src/services/authStorage", () => ({
  getAuthSession: () => getAuthSessionMock(),
}));

vi.mock("../../src/services/relatorioService", () => ({
  getRelatorioAberto: (...args: unknown[]) => getRelatorioAbertoMock(...args),
  createRelatorioItem: (...args: unknown[]) => createRelatorioItemMock(...args),
  updateRelatorioItem: (...args: unknown[]) => updateRelatorioItemMock(...args),
  deleteRelatorioItem: (...args: unknown[]) => deleteRelatorioItemMock(...args),
  fecharRelatorio: (...args: unknown[]) => fecharRelatorioMock(...args),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import RelatorioPage from "../../src/pages/Relatorio/RelatorioPage";

const authSession = {
  token: "jwt.token",
  usuario: {
    id: 1,
    nome: "Operador Manhã",
    email: "operador@ceslog.local",
    perfil: "OPERADOR",
    turno: "MANHA",
  },
};

describe("RelatorioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSessionMock.mockReturnValue(authSession);
  });

  it("cria registro no fluxo happy path", async () => {
    getRelatorioAbertoMock.mockResolvedValue({
      id: 10,
      dataRelatorio: "2026-04-06T00:00:00.000Z",
      status: "ABERTO",
      criadoEm: "2026-04-06T00:00:00.000Z",
      finalizadoEm: null,
      itens: [],
    });

    createRelatorioItemMock.mockResolvedValue({
      id: 20,
      relatorioId: 10,
      usuarioId: 1,
      empresa: "CESLOG",
      placaVeiculo: "ABC1D23",
      nome: "João",
      horaEntrada: "08:00",
      horaSaida: null,
      observacoes: "Entrada principal",
      turno: "MANHA",
      criadoEm: "2026-04-06T08:00:00.000Z",
      usuario: authSession.usuario,
    });

    render(<RelatorioPage />);

    await screen.findByText("Relatório do Dia");

    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "  CESLOG  " } });
    fireEvent.change(screen.getByLabelText("Placa do veículo"), { target: { value: "abc1d23" } });
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "João" } });
    fireEvent.change(screen.getByLabelText("Hora de entrada"), { target: { value: "08:00" } });
    fireEvent.change(screen.getByLabelText("Observações"), { target: { value: "Entrada principal" } });

    fireEvent.click(screen.getByRole("button", { name: "Adicionar registro" }));

    await waitFor(() => {
      expect(createRelatorioItemMock).toHaveBeenCalledTimes(1);
    });

    const callArgs = createRelatorioItemMock.mock.calls[0];
    expect(callArgs[0]).toBe(10);
    expect(callArgs[1]).toMatchObject({
      empresa: "CESLOG",
      placaVeiculo: "ABC1D23",
      nome: "João",
      horaEntrada: "08:00",
    });
    expect(callArgs[2]).toBe("jwt.token");

    expect(screen.getByText("Registro adicionado com sucesso.")).toBeInTheDocument();
  });

  it("mantém tela somente leitura quando relatório está fechado", async () => {
    getRelatorioAbertoMock.mockResolvedValue({
      id: 11,
      dataRelatorio: "2026-04-06T00:00:00.000Z",
      status: "FECHADO",
      criadoEm: "2026-04-06T00:00:00.000Z",
      finalizadoEm: "2026-04-06T23:59:00.000Z",
      itens: [],
    });

    render(<RelatorioPage />);

    await screen.findByText("Relatório fechado: somente leitura.");

    const lockedButtons = screen.getAllByRole("button", { name: "Relatório fechado" });
    expect(lockedButtons.length).toBeGreaterThanOrEqual(1);
    lockedButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
