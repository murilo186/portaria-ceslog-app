import { describe, expect, it, vi } from "vitest";
import { createRelatorioLifecycleService } from "../../src/services/relatorio/createRelatorioLifecycleService";
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

describe("createRelatorioLifecycleService", () => {
  it("bloqueia criacao de novo relatorio quando ja existe aberto", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();
    vi.mocked(repository.findOpenReportWithItems).mockResolvedValue({
      id: 1,
      tenantId: 1,
      dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
      status: "ABERTO",
      criadoEm: new Date("2026-04-13T00:00:00.000Z"),
      finalizadoEm: null,
      itens: [],
    });

    const service = createRelatorioLifecycleService({ repository, runtime });

    await expect(service.createNewReportService(1)).rejects.toMatchObject({
      code: "OPEN_REPORT_EXISTS",
      statusCode: 409,
    });
  });

  it("fecha relatorio aberto e invalida cache", async () => {
    const repository = createRepositoryMock();
    const runtime = createRuntimeMock();

    vi.mocked(repository.findReportById).mockResolvedValue({
      id: 10,
      tenantId: 1,
      dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
      status: "ABERTO",
      criadoEm: new Date("2026-04-13T01:00:00.000Z"),
      finalizadoEm: null,
    });
    vi.mocked(repository.updateRelatorioAsClosed).mockResolvedValue({
      id: 10,
      tenantId: 1,
      dataRelatorio: new Date("2026-04-13T00:00:00.000Z"),
      status: "FECHADO",
      criadoEm: new Date("2026-04-13T01:00:00.000Z"),
      finalizadoEm: new Date("2026-04-13T23:59:59.000Z"),
    });

    const service = createRelatorioLifecycleService({ repository, runtime });
    const result = await service.closeRelatorioService(1, 10);

    expect(repository.updateRelatorioAsClosed).toHaveBeenCalledOnce();
    expect(runtime.cache.invalidateRelatorioReadCaches).toHaveBeenCalledWith(1, 10);
    expect(result.status).toBe("FECHADO");
    expect(result.dataRelatorio).toContain("2026-04-13");
  });
});
