import { getAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { getRelatorioById } from "../../services/relatorioService";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import IconActionButton from "../../components/IconActionButton";
import StatusBadge from "../../components/StatusBadge";
import type { Relatorio } from "../../types/relatorio";
import type { Usuario } from "../../types/usuario";
import { perfilPessoaLabel } from "../../utils/perfilPessoa";

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function getAutor(item: Relatorio["itens"][number], fallbackUser: Usuario | null): string {
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

function renderHighlightedText(text: string, term: string): ReactNode {
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

function countItemOccurrences(item: Relatorio["itens"][number], fallbackUser: Usuario | null, term: string): number {
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

export default function RegistroDetalhePage() {
  const navigate = useNavigate();
  const { relatorioId } = useParams<{ relatorioId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState(searchParams.get("data") ?? "");
  const [searchFilter, setSearchFilter] = useState(searchParams.get("busca") ?? "");
  const [appliedSearchFilter, setAppliedSearchFilter] = useState((searchParams.get("busca") ?? "").trim());

  useEffect(() => {
    const nextDateFilter = searchParams.get("data") ?? "";
    const nextSearchFilter = searchParams.get("busca") ?? "";

    setDateFilter(nextDateFilter);
    setSearchFilter(nextSearchFilter);
    setAppliedSearchFilter(nextSearchFilter.trim());
  }, [searchParams]);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth || !relatorioId) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setUsuarioLogado(authSession.usuario);

    async function loadDetail() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const parsedId = Number(relatorioId);

        if (!Number.isFinite(parsedId)) {
          setErrorMessage("Identificador de relatório inválido.");
          return;
        }

        const detail = await getRelatorioById(parsedId, authSession.token);
        setRelatorio(detail);
      } catch (error) {
        setErrorMessage(getUserErrorMessage(error, "Erro ao carregar registro"));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [navigate, relatorioId]);

  const isAdmin = usuarioLogado?.perfil === "ADMIN";

  const searchStats = useMemo(() => {
    if (!relatorio || !appliedSearchFilter) {
      return {
        totalOccurrences: 0,
        matchedItems: 0,
      };
    }

    return relatorio.itens.reduce(
      (accumulator, item) => {
        const itemOccurrences = countItemOccurrences(item, usuarioLogado, appliedSearchFilter);

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
  }, [appliedSearchFilter, relatorio, usuarioLogado]);

  const handleApplyFilters = () => {
    const normalizedSearch = searchFilter.trim();
    const params = new URLSearchParams();

    if (dateFilter) {
      params.set("data", dateFilter);
    }

    if (normalizedSearch) {
      params.set("busca", normalizedSearch);
    }

    params.set("page", "1");

    setSearchParams(params, { replace: true });
  };

  const handleClearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const handleDownloadCsv = () => {
    if (!relatorio) {
      return;
    }

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
      getAutor(item, usuarioLogado),
      item.criadoEm,
    ]);

    const csvContent = [
      `sep=${separator}`,
      headers.map(escapeCsvValue).join(separator),
      ...rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(separator)),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `registro-${relatorio.dataRelatorio.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2 text-xs"
            onClick={handleDownloadCsv}
            disabled={isLoading || !relatorio || relatorio.itens.length === 0}
          >
            Baixar CSV
          </Button>
          {relatorio ? <StatusBadge status={relatorio.status} /> : null}
        </div>

        <h1 className="text-2xl font-semibold text-text-900">
          {relatorio ? `REGISTRO - ${formatDate(relatorio.dataRelatorio)}` : "REGISTRO"}
        </h1>
        <p className="text-sm text-text-700">Tabela do registro selecionado.</p>
        {!isAdmin ? (
          <p className="text-xs text-text-700">Somente administradores podem editar registros fechados.</p>
        ) : null}
        {appliedSearchFilter ? (
          <p className="text-xs text-text-700">
            {searchStats.totalOccurrences} ocorrência(s) em {searchStats.matchedItems} item(ns) para "{appliedSearchFilter}".
          </p>
        ) : null}
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-data-detalhe" className="text-sm font-medium text-text-700">
              Data
            </label>
            <input
              id="filtro-data-detalhe"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="filtro-busca-detalhe" className="text-sm font-medium text-text-700">
              Busca por placa ou nome
            </label>
            <input
              id="filtro-busca-detalhe"
              type="search"
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              placeholder="Ex.: ABC-1D23 ou João"
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleApplyFilters}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="secondary" onClick={handleClearFilters}>
            Limpar
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Perfil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Saída</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Autor</th>
                {isAdmin ? (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Ações</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                    Carregando...
                  </td>
                </tr>
              ) : !relatorio || relatorio.itens.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                    Nenhum item neste registro.
                  </td>
                </tr>
              ) : (
                relatorio.itens.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(item.empresa, appliedSearchFilter)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(item.placaVeiculo, appliedSearchFilter)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(item.nome, appliedSearchFilter)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      {renderHighlightedText(perfilPessoaLabel(item.perfilPessoa), appliedSearchFilter)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      {renderHighlightedText(item.horaEntrada ?? "-", appliedSearchFilter)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      {renderHighlightedText(item.horaSaida ?? "-", appliedSearchFilter)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      {renderHighlightedText(getAutor(item, usuarioLogado), appliedSearchFilter)}
                    </td>
                    {isAdmin ? (
                      <td className="px-4 py-3 text-sm text-text-900">
                        <IconActionButton action="edit" label="Editar registro" disabled />
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
