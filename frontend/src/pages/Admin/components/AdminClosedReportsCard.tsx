import Card from "../../../components/Card";
import type { RelatorioResumo } from "../../../types/relatorio";
import { formatDate } from "../hooks/useAdminPage";

type AdminClosedReportsCardProps = {
  isLoadingRegistros: boolean;
  reports: RelatorioResumo[];
  onOpenReport: (reportId: number) => void;
};

export default function AdminClosedReportsCard({
  isLoadingRegistros,
  reports,
  onOpenReport,
}: AdminClosedReportsCardProps) {
  return (
    <Card className="space-y-3">
      <h2 className="text-base font-semibold text-text-900">Últimos registros fechados</h2>

      {isLoadingRegistros ? (
        <p className="text-sm text-text-700">Carregando lista...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-text-700">Ainda não há relatórios fechados.</p>
      ) : (
        <div className="divide-y divide-surface-200 rounded-md border border-surface-200">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => onOpenReport(report.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-50"
            >
              <span className="text-sm font-medium text-text-900">REGISTRO - {formatDate(report.dataRelatorio)}</span>
              <span className="text-xs text-text-700">Itens: {report._count?.itens ?? 0}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}