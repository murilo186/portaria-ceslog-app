import { beforeEach, describe, expect, it, vi } from "vitest";

const updateManyMock = vi.fn();
const upsertMock = vi.fn();
const relatorioFindUniqueMock = vi.fn();
const relatorioUpdateMock = vi.fn();
const relatorioCountMock = vi.fn();
const relatorioFindManyMock = vi.fn();

const relatorioItemCreateMock = vi.fn();
const relatorioItemFindUniqueMock = vi.fn();
const relatorioItemUpdateMock = vi.fn();
const relatorioItemDeleteMock = vi.fn();

const transactionMock = vi.fn();

vi.mock("../src/lib/prisma", () => ({
  prisma: {
    relatorio: {
      updateMany: (...args: unknown[]) => updateManyMock(...args),
      upsert: (...args: unknown[]) => upsertMock(...args),
      findUnique: (...args: unknown[]) => relatorioFindUniqueMock(...args),
      update: (...args: unknown[]) => relatorioUpdateMock(...args),
      count: (...args: unknown[]) => relatorioCountMock(...args),
      findMany: (...args: unknown[]) => relatorioFindManyMock(...args),
    },
    relatorioItem: {
      create: (...args: unknown[]) => relatorioItemCreateMock(...args),
      findUnique: (...args: unknown[]) => relatorioItemFindUniqueMock(...args),
      update: (...args: unknown[]) => relatorioItemUpdateMock(...args),
      delete: (...args: unknown[]) => relatorioItemDeleteMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

import {
  createRelatorioItemService,
  getTodayReportService,
  updateRelatorioItemService,
} from "../src/services/relatorioService";

const operador = {
  id: 1,
  perfil: "OPERADOR",
  nome: "Operador",
  email: "operador@ceslog.local",
  turno: "MANHA",
} as const;

describe("relatorioService regras críticas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("garante criação/continuidade de um único relatório por dia via upsert", async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    upsertMock.mockResolvedValue({
      id: 5,
      dataRelatorio: new Date("2026-04-06T00:00:00.000Z"),
      status: "ABERTO",
      itens: [],
    });

    await getTodayReportService();

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledTimes(1);

    const upsertArgs = upsertMock.mock.calls[0][0] as { where: { dataRelatorio: Date } };
    expect(upsertArgs.where.dataRelatorio).toBeInstanceOf(Date);
  });

  it("bloqueia criação de item em relatório fechado", async () => {
    relatorioFindUniqueMock.mockResolvedValue({
      id: 9,
      status: "FECHADO",
    });

    await expect(
      createRelatorioItemService(
        9,
        {
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "João",
          horaEntrada: "08:00",
        },
        operador,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REPORT_CLOSED",
    });
  });

  it("bloqueia edição por usuário que não é autor nem admin", async () => {
    relatorioItemFindUniqueMock.mockResolvedValue({
      id: 20,
      relatorioId: 9,
      usuarioId: 2,
      relatorio: {
        status: "ABERTO",
      },
      usuario: {
        id: 2,
      },
    });

    await expect(
      updateRelatorioItemService(
        9,
        20,
        {
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "Teste",
        },
        operador,
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN_ITEM_OWNER",
    });
  });

  it("bloqueia edição quando relatório já está fechado", async () => {
    relatorioItemFindUniqueMock.mockResolvedValue({
      id: 21,
      relatorioId: 10,
      usuarioId: 1,
      relatorio: {
        status: "FECHADO",
      },
      usuario: {
        id: 1,
      },
    });

    await expect(
      updateRelatorioItemService(
        10,
        21,
        {
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "Teste",
        },
        operador,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REPORT_CLOSED",
    });
  });
});
