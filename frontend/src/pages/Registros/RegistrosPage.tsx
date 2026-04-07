import Button from "../../components/Button";
import Card from "../../components/Card";
import StatusBadge from "../../components/StatusBadge";
import { formatDate, useRegistrosPage } from "./hooks/useRegistrosPage";

export default function RegistrosPage() {
  const {
    registrosFechados,
    meta,
    dateFilter,
    setDateFilter,
    searchFilter,
    setSearchFilter,
    appliedSearchFilter,
    isLoading,
    errorMessage,
    handleApplyFilters,
    handleClearFilters,
    handleChangePage,
    handleOpenDetail,
  } = useRegistrosPage();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-text-900">Registros Fechados</h1>
        <p className="text-sm text-text-700">Filtre por data, placa ou nome para localizar relatórios.</p>
        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filtro-data" className="text-sm font-medium text-text-700">
              Data
            </label>
            <input
              id="filtro-data"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label htmlFor="filtro-busca" className="text-sm font-medium text-text-700">
              Busca por placa ou nome
            </label>
            <input
              id="filtro-busca"
              type="search"
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              placeholder="Ex.: ABC-1D23 ou João"
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleApplyFilters} disabled={isLoading}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="secondary" onClick={handleClearFilters} disabled={isLoading}>
            Limpar
          </Button>
        </div>

        <p className="text-xs text-text-700">
          {appliedSearchFilter
            ? `${meta.total} evidência(s) encontrada(s) para "${appliedSearchFilter}".`
            : `${meta.total} registro(s) fechado(s) encontrado(s).`}
        </p>
      </Card>

      <Card className="p-0">
        <div className="divide-y divide-surface-200">
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-text-700">Carregando...</p>
          ) : registrosFechados.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-700">Nenhum registro fechado encontrado.</p>
          ) : (
            registrosFechados.map((registro) => (
              <button
                key={registro.id}
                type="button"
                onClick={() => handleOpenDetail(registro.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-50"
              >
                <span className="text-sm font-semibold text-text-900">REGISTRO - {formatDate(registro.dataRelatorio)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-700">Itens: {registro._count?.itens ?? 0}</span>
                  <StatusBadge status={registro.status} />
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-text-700">
          Página {meta.page} de {meta.totalPages} • {meta.total} registro(s)
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2 text-xs"
            onClick={() => handleChangePage(Math.max(1, meta.page - 1))}
            disabled={isLoading || meta.page <= 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-2 text-xs"
            onClick={() => handleChangePage(Math.min(meta.totalPages, meta.page + 1))}
            disabled={isLoading || meta.page >= meta.totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
