import Button from "../../../components/Button";
import FeedbackMessage from "../../../components/FeedbackMessage";
import Skeleton from "../../../components/Skeleton";
import StatusBadge from "../../../components/StatusBadge";
import { memo } from "react";
import { formatDate } from "../hooks/useRegistroDetalhePage";

type RegistroDetalheHeaderProps = {
  status: "ABERTO" | "FECHADO" | null;
  dataRelatorio: string | null;
  isLoading: boolean;
  canDownloadCsv: boolean;
  isAdmin: boolean;
  appliedSearchFilter: string;
  totalOccurrences: number;
  matchedItems: number;
  errorMessage: string | null;
  onDownloadCsv: () => void;
};

function RegistroDetalheHeader({
  status,
  dataRelatorio,
  isLoading,
  canDownloadCsv,
  isAdmin,
  appliedSearchFilter,
  totalOccurrences,
  matchedItems,
  errorMessage,
  onDownloadCsv,
}: RegistroDetalheHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-2 text-xs"
          onClick={onDownloadCsv}
          disabled={isLoading || !canDownloadCsv}
        >
          Baixar CSV
        </Button>
        {status ? <StatusBadge status={status} /> : null}
      </div>

      <h1 className="text-2xl font-semibold text-text-900">
        {isLoading && !dataRelatorio ? <Skeleton className="h-7 w-56" /> : dataRelatorio ? `REGISTRO - ${formatDate(dataRelatorio)}` : "REGISTRO"}
      </h1>
      <p className="text-sm text-text-700">Tabela do registro selecionado.</p>
      {!isAdmin ? <p className="text-xs text-text-700">Somente administradores podem editar registros fechados.</p> : null}
      {appliedSearchFilter ? (
        <p className="text-xs text-text-700">
          {totalOccurrences} ocorrencias em {matchedItems} item(ns) para "{appliedSearchFilter}".
        </p>
      ) : null}
      {errorMessage ? <FeedbackMessage message={errorMessage} tone="error" /> : null}
    </div>
  );
}

export default memo(RegistroDetalheHeader);
