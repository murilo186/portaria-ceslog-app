import { describe, expect, it, vi } from "vitest";
import { createRelatorioQueryService } from "../../src/services/relatorio/createRelatorioQueryService";
import type { IRelatorioRepository } from "../../src/repositories/relatorioRepository";
import type { RelatorioRuntimeDeps } from "../../src/services/relatorio/dependencies";

function createRepositoryMock(): IRelatorioRepository {
  return {
    findOpenReportsForCleanup: vi.fn().mockResolvedValue([]),
    closeReportsByIds: vi.fn().mockResolvedValue(undefined),
    findOpenReportWithItems: vi.fn(),
    createOpenReportWithItems: vi.fn(),
    listReportSummaries: vi.fn(),
    countClosedReports: vi.fn(),
    listClosedReports: vi.fn(),
    findReportByIdWithItems: vi.fn(),
    findReportByIdWithoutItems: vi.fn(),
    listReportItemsByCursor: vi.fn(),
    findReportById: vi.fn(),
    findReportStatusById: vi.fn(),
    createRelatorioItem: vi.fn(),
    findManagedItem: vi.fn(),
    updateRelatorioItem: vi.fn(),
    deleteRelatorioItemById: vi.fn(),
    updateRelatorioAsClosed: vi.fn(),
  };
}

function createRuntimeMock(): RelatorioRuntimeDeps {
  return {
    cache: {
      getClosedReportsCache: vi.fn(),
      getOpenReportCache: vi.fn(),
      getReportDetailCache: vi.fn(),
      invalidateRelatorioReadCaches: vi.fn(),
      setClosedReportsCache: vi.fn(),
      setOpenReportCache: vi.fn(),
      setReportDetailCache: vi.fn(),
    },
    policies: {
      assertCanManageItem: vi.fn(),
      getDateRange: vi.fn(),
    },
    staleReports: {
      closeStaleOpenReports: vi.fn().mockResolvedValue(undefined),
    },
    sanitize: {
      sanitizeNullableText: vi.fn(),
      sanitizeText: vi.fn(),
    },
    clock: {
      getBusinessDateKey: vi.fn((dateLike: Date | string) =>
        new Date(dateLike).toISOString().slice(0, 10),
      ),
      getCurrentBusinessDateKey: vi.fn(() => "2026-04-13"),
      getCurrentDate: vi.fn(() => new Date("2026-04-13T10:00:00.000Z")),
    },
  };
}

describe("createRelatorioQueryService", () => {
  it("retorna itens paginados por cursor com metadados", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();
    vi.mocked(repository.findReportByIdWithoutItems).mockResolvedValue({
      id: 7,
      dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
      status: "ABERTO",
      criadoEm: new Date("2026-04-13T00:00:00.000Z"),
      finalizadoEm: null,
    });
    vi.mocked(repository.listReportItemsByCursor).mockResolvedValue([
      {
        id: 30,
        relatorioId: 7,
        usuarioId: 1,
        perfilPessoa: "VISITANTE",
        empresa: "Empresa A",
        placaVeiculo: "ABC1D23",
        nome: "Pessoa 1",
        horaEntrada: "08:00",
        horaSaida: null,
        observacoes: null,
        turno: "MANHA",
        criadoEm: new Date("2026-04-13T08:00:00.000Z"),
        usuario: {
          id: 1,
          nome: "Operador",
          usuario: "operador",
          email: null,
          perfil: "OPERADOR",
          turno: "MANHA",
        },
      },
      {
        id: 29,
        relatorioId: 7,
        usuarioId: 1,
        perfilPessoa: "VISITANTE",
        empresa: "Empresa B",
        placaVeiculo: "ABC1D24",
        nome: "Pessoa 2",
        horaEntrada: "08:10",
        horaSaida: null,
        observacoes: null,
        turno: "MANHA",
        criadoEm: new Date("2026-04-13T08:10:00.000Z"),
        usuario: {
          id: 1,
          nome: "Operador",
          usuario: "operador",
          email: null,
          perfil: "OPERADOR",
          turno: "MANHA",
        },
      },
      {
        id: 28,
        relatorioId: 7,
        usuarioId: 1,
        perfilPessoa: "VISITANTE",
        empresa: "Empresa C",
        placaVeiculo: "ABC1D25",
        nome: "Pessoa 3",
        horaEntrada: "08:20",
        horaSaida: null,
        observacoes: null,
        turno: "MANHA",
        criadoEm: new Date("2026-04-13T08:20:00.000Z"),
        usuario: {
          id: 1,
          nome: "Operador",
          usuario: "operador",
          email: null,
          perfil: "OPERADOR",
          turno: "MANHA",
        },
      },
    ]);

    const service = createRelatorioQueryService({ repository, runtime });
    const result = await service.getReportByIdService(7, { itemLimit: 2 });

    expect(result).not.toBeNull();
    expect(result?.itens).toHaveLength(2);
    expect(result?.itensPage).toEqual({
      itemLimit: 2,
      nextItemCursor: 29,
      hasMore: true,
    });
  });

  it("usa cache para listagem de relatórios fechados quando disponível", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();
    vi.mocked(runtime.cache.getClosedReportsCache).mockReturnValue({
      data: [],
      meta: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
      },
    });

    const service = createRelatorioQueryService({ repository, runtime });
    const response = await service.listClosedReportsService({ page: 1, pageSize: 10 });

    expect(response.meta.total).toBe(0);
    expect(repository.countClosedReports).not.toHaveBeenCalled();
    expect(repository.listClosedReports).not.toHaveBeenCalled();
  });
});
