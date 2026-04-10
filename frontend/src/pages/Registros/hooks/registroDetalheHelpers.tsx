import type { ReactNode } from "react";
import type { Relatorio } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { perfilPessoaLabel } from "../../../utils/perfilPessoa";

type RelatorioItem = Relatorio["itens"][number];

export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function getAutor(item: RelatorioItem, fallbackUser: Usuario | null): string {
  if (item.usuario?.nome) {
    return item.usuario.nome;
  }

  if (fallbackUser) {
    return fallbackUser.nome;
  }

  return "-";
}

function escapeCsvValue(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countOccurrences(text: string, term: string): number {
  if (!term) {
    return 0;
  }

  const matches = text.match(new RegExp(escapeRegExp(term), "gi"));
  return matches ? matches.length : 0;
}

function countItemOccurrences(item: RelatorioItem, fallbackUser: Usuario | null, term: string): number {
  const fields = [
    item.empresa,
    item.placaVeiculo,
    item.nome,
    perfilPessoaLabel(item.perfilPessoa),
    item.horaEntrada ?? "",
    item.horaSaida ?? "",
    item.observacoes ?? "",
    getAutor(item, fallbackUser),
  ];

  return fields.reduce((total, field) => total + countOccurrences(field, term), 0);
}

export function getSearchStats(relatorio: Relatorio | null, fallbackUser: Usuario | null, term: string) {
  if (!relatorio || !term) {
    return {
      totalOccurrences: 0,
      matchedItems: 0,
    };
  }

  return relatorio.itens.reduce(
    (accumulator, item) => {
      const itemOccurrences = countItemOccurrences(item, fallbackUser, term);

      return {
        totalOccurrences: accumulator.totalOccurrences + itemOccurrences,
        matchedItems: accumulator.matchedItems + (itemOccurrences > 0 ? 1 : 0),
      };
    },
    {
      totalOccurrences: 0,
      matchedItems: 0,
    },
  );
}

export function renderHighlightedText(text: string, term: string): ReactNode {
  if (!term) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
  const normalizedTerm = term.toLowerCase();
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === normalizedTerm ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-text-900">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

export function buildRegistroCsv(relatorio: Relatorio, fallbackUser: Usuario | null): string {
  const headers = [
    "Empresa",
    "Placa",
    "Nome",
    "Perfil",
    "Entrada",
    "Saída",
    "Observações",
    "Turno",
    "Autor",
    "Criado em",
  ];
  const separator = ";";

  const rows = relatorio.itens.map((item) => [
    item.empresa,
    item.placaVeiculo,
    item.nome,
    perfilPessoaLabel(item.perfilPessoa),
    item.horaEntrada ?? "-",
    item.horaSaida ?? "-",
    item.observacoes ?? "-",
    item.turno ?? "-",
    getAutor(item, fallbackUser),
    item.criadoEm,
  ]);

  return [
    `sep=${separator}`,
    headers.map(escapeCsvValue).join(separator),
    ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(separator)),
  ].join("\r\n");
}