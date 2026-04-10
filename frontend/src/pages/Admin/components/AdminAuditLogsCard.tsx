import Button from "../../../components/Button";
import Card from "../../../components/Card";
import type { AuditLogItem } from "../../../types/usuario";
import { formatActionLabel, formatAuditDetails, formatDateTime, formatUserAgent } from "../hooks/useAdminPage";

type AdminAuditLogsCardProps = {
  isLoadingLogs: boolean;
  logs: AuditLogItem[];
  onRefreshLogs: () => Promise<void>;
};

export default function AdminAuditLogsCard({ isLoadingLogs, logs, onRefreshLogs }: AdminAuditLogsCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text-900">Logs de auditoria</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-700">Mostrando últimos {logs.length} eventos</span>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            onClick={() => void onRefreshLogs()}
            disabled={isLoadingLogs}
          >
            Atualizar logs
          </Button>
        </div>
      </div>

      {isLoadingLogs ? (
        <p className="text-sm text-text-700">Carregando lista...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-text-700">Ainda não há eventos registrados.</p>
      ) : (
        <div className="divide-y divide-surface-200 rounded-md border border-surface-200">
          {logs.map((log) => (
            <div key={log.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-900">{formatActionLabel(log.acao)}</p>
                <p className="text-xs text-text-700">{formatDateTime(log.criadoEm)}</p>
              </div>
              <p className="text-sm text-text-700">{log.descricao}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-700">
                <span>Autor: {log.usuario?.nome ?? log.usuarioNome ?? "-"}</span>
                <span>Login: {log.usuario?.usuario ?? log.usuarioLogin ?? "-"}</span>
                <span>
                  Alvo: {log.entidade}
                  {log.entidadeId ? ` #${log.entidadeId}` : ""}
                </span>
                <span>IP: {log.ip ?? "-"}</span>
                <span>Request ID: {log.requestId ?? "-"}</span>
                <span>User-Agent: {formatUserAgent(log.userAgent)}</span>
              </div>
              {formatAuditDetails(log.detalhes) ? (
                <p className="text-xs text-text-700">Detalhes: {formatAuditDetails(log.detalhes)}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}