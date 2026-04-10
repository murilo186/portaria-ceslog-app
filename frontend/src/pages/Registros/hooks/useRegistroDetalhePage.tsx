import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { getRelatorioById } from "../../../services/relatorioService";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Relatorio } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { perfilPessoaLabel } from "../../../utils/perfilPessoa";

export function formatDate(dateIso: string): string {
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

export function useRegistroDetalhePage() {
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

  const getAutorLabel = (item: Relatorio["itens"][number]) => getAutor(item, usuarioLogado);

  return {
    relatorio,
    isLoading,
    errorMessage,
    isAdmin,
    searchStats,
    dateFilter,
    setDateFilter,
    searchFilter,
    setSearchFilter,
    appliedSearchFilter,
    handleApplyFilters,
    handleClearFilters,
    handleDownloadCsv,
    renderHighlightedText,
    getAutorLabel,
  };
}
