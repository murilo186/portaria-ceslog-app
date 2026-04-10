import Button from "../../components/Button";
import Card from "../../components/Card";
import IconActionButton from "../../components/IconActionButton";
import StatusBadge from "../../components/StatusBadge";
import { perfilPessoaLabel } from "../../utils/perfilPessoa";
import { formatDate, useRegistroDetalhePage } from "./hooks/useRegistroDetalhePage";

export default function RegistroDetalhePage() {
  const {
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
  } = useRegistroDetalhePage();

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
        {!isAdmin ? <p className="text-xs text-text-700">Somente administradores podem editar registros fechados.</p> : null}
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
                {isAdmin ? <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Ações</th> : null}
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
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(item.horaEntrada ?? "-", appliedSearchFilter)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(item.horaSaida ?? "-", appliedSearchFilter)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{renderHighlightedText(getAutorLabel(item), appliedSearchFilter)}</td>
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
