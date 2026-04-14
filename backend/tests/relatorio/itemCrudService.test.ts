import { describe, expect, it, vi } from "vitest";
import { createRelatorioItemCrudService } from "../../src/services/relatorio/createRelatorioItemCrudService";
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
      sanitizeNullableText: vi.fn((value?: string) => value?.trim() ?? null),
      sanitizeText: vi.fn((value: string) => value.trim()),
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

const operador = {
  id: 1,
  tenantId: 1,
  tenantSlug: "ceslog",
  tenantNome: "CESLOG",
  nome: "Operador",
  usuario: "operador",
  email: null,
  perfil: "OPERADOR" as const,
  turno: "MANHA" as const,
};

describe("createRelatorioItemCrudService", () => {
  it("permite admin atualizar item de outro autor", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();
    const adminUser = { ...operador, id: 99, perfil: "ADMIN" as const, turno: null };

    vi.mocked(repository.findManagedItem).mockResolvedValue({
      id: 10,
      tenantId: 1,
      relatorioId: 5,
      usuarioId: 1,
      perfilPessoa: "VISITANTE",
      empresa: "Empresa",
      placaVeiculo: "ABC1D23",
      nome: "Pessoa",
      horaEntrada: "08:00",
      horaSaida: null,
      observacoes: null,
      turno: "MANHA",
      criadoEm: new Date("2026-04-13T08:00:00.000Z"),
      relatorio: {
        id: 5,
        tenantId: 1,
        dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
        status: "ABERTO",
        criadoEm: new Date("2026-04-13T00:00:00.000Z"),
        finalizadoEm: null,
      },
      usuario: {
        id: 1,
        nome: "Autor",
        usuario: "autor",
        email: null,
        perfil: "OPERADOR",
        turno: "MANHA",
      },
    });
    vi.mocked(repository.updateRelatorioItem).mockResolvedValue({
      id: 10,
      tenantId: 1,
      relatorioId: 5,
      usuarioId: 1,
      perfilPessoa: "VISITANTE",
      empresa: "Empresa nova",
      placaVeiculo: "ABC1D23",
      nome: "Pessoa nova",
      horaEntrada: "08:00",
      horaSaida: null,
      observacoes: null,
      turno: "MANHA",
      criadoEm: new Date("2026-04-13T08:00:00.000Z"),
    });
    vi.mocked(runtime.policies.assertCanManageItem).mockImplementation(() => undefined);

    const service = createRelatorioItemCrudService({ repository, runtime });
    const result = await service.updateRelatorioItemService(
      5,
      10,
      {
        perfilPessoa: "VISITANTE",
        empresa: "Empresa nova",
        placaVeiculo: "abc1d23",
        nome: "Pessoa nova",
        observacoes: "",
      },
      adminUser,
    );

    expect(runtime.policies.assertCanManageItem).toHaveBeenCalledWith(adminUser, 1, "ABERTO");
    expect(repository.updateRelatorioItem).toHaveBeenCalledOnce();
    expect(result.usuario.id).toBe(1);
  });

  it("bloqueia exclusao quando politica rejeita autorizacao", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();
    vi.mocked(repository.findManagedItem).mockResolvedValue({
      id: 11,
      tenantId: 1,
      relatorioId: 6,
      usuarioId: 2,
      perfilPessoa: "VISITANTE",
      empresa: "Empresa",
      placaVeiculo: "ABC1D23",
      nome: "Pessoa",
      horaEntrada: "08:00",
      horaSaida: null,
      observacoes: null,
      turno: "MANHA",
      criadoEm: new Date("2026-04-13T08:00:00.000Z"),
      relatorio: {
        id: 6,
        tenantId: 1,
        dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
        status: "ABERTO",
        criadoEm: new Date("2026-04-13T00:00:00.000Z"),
        finalizadoEm: null,
      },
      usuario: {
        id: 2,
        nome: "Outro",
        usuario: "outro",
        email: null,
        perfil: "OPERADOR",
        turno: "MANHA",
      },
    });
    vi.mocked(runtime.policies.assertCanManageItem).mockImplementation(() => {
      throw new Error("FORBIDDEN");
    });

    const service = createRelatorioItemCrudService({ repository, runtime });

    await expect(service.deleteRelatorioItemService(6, 11, operador)).rejects.toThrow("FORBIDDEN");
    expect(repository.deleteRelatorioItemById).not.toHaveBeenCalled();
  });
});
