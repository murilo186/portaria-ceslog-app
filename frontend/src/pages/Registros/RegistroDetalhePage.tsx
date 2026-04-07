import { getAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { getRelatorioById } from "../../services/relatorioService";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
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

export default function RegistroDetalhePage() {
  const navigate = useNavigate();
  const { relatorioId } = useParams<{ relatorioId: string }>();

  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth || !relatorioId) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setUsuarioLogado(authSession.usuario);

    async function loadDetail() {
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
          <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => navigate(-1)}>
            Voltar
          </Button>
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
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>

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
                    <td className="px-4 py-3 text-sm text-text-900">{item.empresa}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.placaVeiculo}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.nome}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{perfilPessoaLabel(item.perfilPessoa)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaEntrada ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaSaida ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{getAutor(item, usuarioLogado)}</td>
                    {isAdmin ? (
                      <td className="px-4 py-3 text-sm text-text-900">
                        <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" disabled>
                          Editar
                        </Button>
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






