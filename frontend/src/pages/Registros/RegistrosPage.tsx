import Button from "../../components/Button";
import Card from "../../components/Card";
import FeedbackMessage from "../../components/FeedbackMessage";
import Input from "../../components/Input";
import ListSkeleton from "../../components/ListSkeleton";
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
    isFetching,
    errorMessage,
    handleApplyFilters,
    handleClearFilters,
    handleChangePage,
    handleOpenDetail,
  } = useRegistrosPage();

  return (
    <div className="space-y-6" aria-busy={isLoading || isFetching}>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-text-900 sm:text-2xl">Registros Fechados</h1>
        <p className="text-sm text-text-700">Filtre por data, placa ou nome para localizar relatórios.</p>
        {errorMessage ? <FeedbackMessage message={errorMessage} tone="error" /> : null}
      </div>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input id="filtro-data" type="date" label="Data" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />

          <div className="md:col-span-2">
            <Input
              id="filtro-busca"
              type="search"
              label="Busca por placa ou nome"
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.target.value)}
              placeholder="Ex.: ABC-1D23 ou João"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
          <Button type="button" onClick={handleApplyFilters} disabled={isLoading} className="w-full sm:w-auto">
            Aplicar filtros
          </Button>
          <Button type="button" variant="secondary" onClick={handleClearFilters} disabled={isLoading} className="w-full sm:w-auto">
            Limpar
          </Button>
        </div>

        <p className="text-xs text-text-700">
          {appliedSearchFilter
            ? `${meta.total} evidências encontradas para "${appliedSearchFilter}".`
            : `${meta.total} registro(s) fechado(s) encontrado(s).`}
        </p>
        {isFetching && !isLoading ? <p className="text-xs text-text-700">Atualizando resultados...</p> : null}
      </Card>

      <Card className="p-0">
        <div className="divide-y divide-surface-200">
          {isLoading ? (
            <div className="px-4 py-4">
              <ListSkeleton rows={6} />
            </div>
          ) : registrosFechados.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-700">Nenhum registro fechado encontrado.</p>
          ) : (
            registrosFechados.map((registro) => (
              <button
                key={registro.id}
                type="button"
                onClick={() => handleOpenDetail(registro.id)}
                className="flex w-full flex-col items-start justify-between gap-2 px-4 py-4 text-left transition-colors hover:bg-surface-50 sm:flex-row sm:items-center"
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-700">
          Página {meta.page} de {meta.totalPages} · {meta.total} registro(s)
        </p>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            className="w-full px-3 py-2 text-xs"
            onClick={() => handleChangePage(Math.max(1, meta.page - 1))}
            disabled={isLoading || meta.page <= 1}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full px-3 py-2 text-xs"
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

