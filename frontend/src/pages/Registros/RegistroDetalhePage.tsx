import RegistroDetalheFiltersCard from "./components/RegistroDetalheFiltersCard";
import RegistroDetalheHeader from "./components/RegistroDetalheHeader";
import RegistroDetalheTable from "./components/RegistroDetalheTable";
import { useRegistroDetalhePage } from "./hooks/useRegistroDetalhePage";

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
    hasMoreItemsFromServer,
    isLoadingMoreItems,
    handleLoadMoreItems,
    renderHighlightedText,
    getAutorLabel,
  } = useRegistroDetalhePage();

  return (
    <div className="space-y-6">
      <RegistroDetalheHeader
        status={relatorio?.status ?? null}
        dataRelatorio={relatorio?.dataRelatorio ?? null}
        isLoading={isLoading}
        canDownloadCsv={Boolean(relatorio && relatorio.itens.length > 0)}
        isAdmin={isAdmin}
        appliedSearchFilter={appliedSearchFilter}
        totalOccurrences={searchStats.totalOccurrences}
        matchedItems={searchStats.matchedItems}
        errorMessage={errorMessage}
        onDownloadCsv={handleDownloadCsv}
      />

      <RegistroDetalheFiltersCard
        dateFilter={dateFilter}
        searchFilter={searchFilter}
        onChangeDate={setDateFilter}
        onChangeSearch={setSearchFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <RegistroDetalheTable
        relatorio={relatorio}
        isLoading={isLoading}
        isLoadingMoreItems={isLoadingMoreItems}
        isAdmin={isAdmin}
        hasMoreItemsFromServer={hasMoreItemsFromServer}
        onLoadMoreItems={handleLoadMoreItems}
        appliedSearchFilter={appliedSearchFilter}
        renderHighlightedText={renderHighlightedText}
        getAutorLabel={getAutorLabel}
      />

      <button
        type="button"
        aria-label="Ir para o fim da tela"
        onClick={() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          })
        }
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-surface-200 bg-white/90 px-4 py-2 text-sm font-semibold text-text-900 shadow md:hidden"
      >
        ↓
      </button>
    </div>
  );
}
