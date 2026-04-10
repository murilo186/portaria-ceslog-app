import { beforeEach, describe, expect, it, vi } from "vitest";

const updateManyMock = vi.fn();
const findFirstMock = vi.fn();
const createMock = vi.fn();
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
      findFirst: (...args: unknown[]) => findFirstMock(...args),
      create: (...args: unknown[]) => createMock(...args),
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
  usuario: "operador.manha",
  email: "operador@ceslog.local",
  turno: "MANHA",
} as const;

describe("relatorioService regras críticas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    relatorioFindManyMock.mockResolvedValue([]);
  });

  it("retorna relatório aberto atual quando existir", async () => {
    findFirstMock.mockResolvedValue({
      id: 5,
      dataRelatorio: new Date("2026-04-06T10:30:00.000Z"),
      status: "ABERTO",
      itens: [],
    });

    const report = await getTodayReportService();

    expect(relatorioFindManyMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
    expect(report.id).toBe(5);
  });

  it("cria novo relatório quando não existe nenhum aberto", async () => {
    findFirstMock.mockResolvedValue(null);
    createMock.mockResolvedValue({
      id: 5,
      dataRelatorio: new Date("2026-04-06T11:00:00.000Z"),
      status: "ABERTO",
      itens: [],
    });

    const report = await getTodayReportService();

    expect(relatorioFindManyMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(report.id).toBe(5);
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
          perfilPessoa: "VISITANTE",
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "João",
          horaEntrada: "08:00",
          observacoes: "Teste",
        },
        operador,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REPORT_CLOSED",
    });
  });

  it("sanitiza campos textuais para reduzir risco de XSS armazenado", async () => {
    relatorioFindUniqueMock.mockResolvedValue({
      id: 11,
      status: "ABERTO",
    });
    relatorioItemCreateMock.mockResolvedValue({
      id: 30,
      relatorioId: 11,
      usuarioId: 1,
      perfilPessoa: "VISITANTE",
      empresa: "Empresa teste",
      placaVeiculo: "ABC1D23",
      nome: "Nome teste",
      observacoes: "Observacao teste",
    });

    await createRelatorioItemService(
      11,
      {
        perfilPessoa: "VISITANTE",
        empresa: "  <b>Empresa</b> teste  ",
        placaVeiculo: " abc1d23 ",
        nome: "<script>alert(1)</script>Nome teste",
        observacoes: "<img src=x onerror=alert(1)>Observacao teste",
      },
      operador,
    );

    expect(relatorioItemCreateMock).toHaveBeenCalledTimes(1);

    const [callArg] = relatorioItemCreateMock.mock.calls[0] as [{ data: Record<string, unknown> }];
    const payload = callArg.data;

    expect(payload.empresa).toBe("Empresa teste");
    expect(payload.nome).toBe("alert(1) Nome teste");
    expect(payload.observacoes).toBe("Observacao teste");
    expect(payload.placaVeiculo).toBe("ABC1D23");
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
          perfilPessoa: "VISITANTE",
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "Teste",
          observacoes: "Teste",
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
          perfilPessoa: "VISITANTE",
          empresa: "CESLOG",
          placaVeiculo: "ABC1D23",
          nome: "Teste",
          observacoes: "Teste",
        },
        operador,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "REPORT_CLOSED",
    });
  });
});
