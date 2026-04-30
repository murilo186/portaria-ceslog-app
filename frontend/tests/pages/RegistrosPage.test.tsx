import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const handleApplyFilters = vi.fn();
const handleClearFilters = vi.fn();
const handleChangePage = vi.fn();
const handleOpenDetail = vi.fn();

vi.mock("../../src/pages/Registros/hooks/useRegistrosPage", () => ({
  formatDate: (iso: string) => {
    const [year, month, day] = iso.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  },
  useRegistrosPage: () => ({
    registrosFechados: [
      {
        id: 7,
        dataRelatorio: "2026-04-29T00:00:00.000Z",
        status: "FECHADO",
        criadoEm: "2026-04-29T00:00:00.000Z",
        finalizadoEm: "2026-04-29T23:59:00.000Z",
        _count: { itens: 3 },
      },
    ],
    meta: {
      page: 1,
      pageSize: 10,
      total: 12,
      totalPages: 2,
    },
    dateFilter: "",
    setDateFilter: vi.fn(),
    searchFilter: "",
    setSearchFilter: vi.fn(),
    appliedSearchFilter: "abc1d23",
    isLoading: false,
    isFetching: false,
    errorMessage: null,
    handleApplyFilters,
    handleClearFilters,
    handleChangePage,
    handleOpenDetail,
  }),
}));

import RegistrosPage from "../../src/pages/Registros/RegistrosPage";

describe("RegistrosPage", () => {
  it("renderiza filtros e aciona paginação e detalhe", () => {
    render(<RegistrosPage />);

    expect(screen.getByText("Registros Fechados")).toBeInTheDocument();
    expect(screen.getByText('12 evidências encontradas para "abc1d23".')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    fireEvent.click(screen.getByRole("button", { name: /REGISTRO - 29\/04\/2026/i }));

    expect(handleApplyFilters).toHaveBeenCalledTimes(1);
    expect(handleClearFilters).toHaveBeenCalledTimes(1);
    expect(handleChangePage).toHaveBeenCalledWith(2);
    expect(handleOpenDetail).toHaveBeenCalledWith(7);
  });
});
