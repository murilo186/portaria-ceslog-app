import type { RelatorioBase, RelatorioComItens, RelatorioItemComUsuario, RelatorioResumo } from "../../repositories/relatorioRepository";

function toIso(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

export type RelatorioItemResponse = {
  id: number;
  relatorioId: number;
  usuarioId: number;
  perfilPessoa: RelatorioItemComUsuario["perfilPessoa"];
  empresa: string;
  placaVeiculo: string;
  nome: string;
  horaEntrada: string | null;
  horaSaida: string | null;
  observacoes: string | null;
  turno: string | null;
  criadoEm: string | null;
  usuario:
    | {
        id: number;
        nome: string;
        usuario: string | null;
        email: string | null;
        perfil: RelatorioItemComUsuario["usuario"]["perfil"];
        turno: RelatorioItemComUsuario["usuario"]["turno"];
      }
    | undefined;
};

export type RelatorioResponse = {
  id: number;
  dataRelatorio: string | null;
  status: RelatorioComItens["status"];
  criadoEm: string | null;
  finalizadoEm: string | null;
  itens: RelatorioItemResponse[];
};

export type RelatorioResumoResponse = {
  id: number;
  dataRelatorio: string | null;
  status: RelatorioResumo["status"];
  criadoEm: string | null;
  finalizadoEm: string | null;
  _count: RelatorioResumo["_count"];
};

export function toRelatorioItemResponse(item: RelatorioItemComUsuario | RelatorioComItens["itens"][number]) {
  return {
    ...item,
    criadoEm: toIso(item.criadoEm),
    horaEntrada: item.horaEntrada ?? null,
    horaSaida: item.horaSaida ?? null,
    observacoes: item.observacoes ?? null,
    usuario: item.usuario ? { ...item.usuario } : undefined,
  };
}

export function toRelatorioResponse(relatorio: RelatorioComItens) {
  return {
    id: relatorio.id,
    dataRelatorio: toIso(relatorio.dataRelatorio),
    status: relatorio.status,
    criadoEm: toIso(relatorio.criadoEm),
    finalizadoEm: toIso(relatorio.finalizadoEm),
    itens: relatorio.itens.map((item) => toRelatorioItemResponse(item)),
  };
}

export function toRelatorioBaseResponse(relatorio: RelatorioBase, itens: RelatorioItemComUsuario[]) {
  return {
    id: relatorio.id,
    dataRelatorio: toIso(relatorio.dataRelatorio),
    status: relatorio.status,
    criadoEm: toIso(relatorio.criadoEm),
    finalizadoEm: toIso(relatorio.finalizadoEm),
    itens: itens.map((item) => toRelatorioItemResponse(item)),
  };
}

export function toRelatorioResumoResponse(relatorio: RelatorioResumo) {
  return {
    id: relatorio.id,
    dataRelatorio: toIso(relatorio.dataRelatorio),
    status: relatorio.status,
    criadoEm: toIso(relatorio.criadoEm),
    finalizadoEm: toIso(relatorio.finalizadoEm),
    _count: relatorio._count,
  };
}
