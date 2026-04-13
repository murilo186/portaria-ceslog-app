import Button from "../../../components/Button";
import Card from "../../../components/Card";
import IconActionButton from "../../../components/IconActionButton";
import TableSkeleton from "../../../components/TableSkeleton";
import { useIncrementalRender } from "../../../hooks/useIncrementalRender";
import type { RelatorioItem } from "../../../types/relatorio";

type RelatorioDesktopTableProps = {
  isLoading: boolean;
  items: RelatorioItem[];
  isReadOnly: boolean;
  isSubmitting: boolean;
  canManageItem: (item: RelatorioItem) => boolean;
  onEdit: (item: RelatorioItem) => void;
  onDelete: (item: RelatorioItem) => Promise<void>;
  getAutorLabel: (item: RelatorioItem) => string;
  perfilPessoaLabel: (perfil: RelatorioItem["perfilPessoa"]) => string;
};

export default function RelatorioDesktopTable({
  isLoading,
  items,
  isReadOnly,
  isSubmitting,
  canManageItem,
  onEdit,
  onDelete,
  getAutorLabel,
  perfilPessoaLabel,
}: RelatorioDesktopTableProps) {
  const { visibleCount, visibleItems, hasMore, showMore } = useIncrementalRender({
    items,
    initialCount: 40,
    step: 40,
  });

  return (
    <Card className="hidden p-0 md:block">
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Turno</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Autor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Observações</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-text-700">
                  <TableSkeleton rows={6} columns={10} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-text-700">
                  Nenhum registro adicionado até o momento.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => {
                const canManage = canManageItem(item) && !isReadOnly;

                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-text-900">{item.empresa}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.placaVeiculo}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.nome}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{perfilPessoaLabel(item.perfilPessoa)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaEntrada ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaSaida ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.turno ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{getAutorLabel(item)}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.observacoes ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <IconActionButton
                            action="edit"
                            label="Editar registro"
                            onClick={() => onEdit(item)}
                            disabled={isSubmitting}
                          />
                          <IconActionButton
                            action="delete"
                            label="Excluir registro"
                            onClick={() => void onDelete(item)}
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-text-700">Sem permissão</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && items.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-t border-surface-200 px-4 py-3">
          <p className="text-xs text-text-700">
            Mostrando {visibleCount} de {items.length} registro(s).
          </p>
          {hasMore ? (
            <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={showMore}>
              Carregar mais
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
