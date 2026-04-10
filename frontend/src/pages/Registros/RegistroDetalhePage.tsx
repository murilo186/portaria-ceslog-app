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
        isAdmin={isAdmin}
        appliedSearchFilter={appliedSearchFilter}
        renderHighlightedText={renderHighlightedText}
        getAutorLabel={getAutorLabel}
      />
    </div>
  );
}