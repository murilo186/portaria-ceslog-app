import Button from "../../../components/Button";
import Card from "../../../components/Card";
import IconActionButton from "../../../components/IconActionButton";
import TableSkeleton from "../../../components/TableSkeleton";
import { useIncrementalRender } from "../../../hooks/useIncrementalRender";
import { perfilPessoaLabel } from "../../../utils/perfilPessoa";
import type { Relatorio } from "../../../types/relatorio";
import { memo, useMemo, type ReactNode } from "react";

type RegistroDetalheTableProps = {
  relatorio: Relatorio | null;
  isLoading: boolean;
  isLoadingMoreItems: boolean;
  isAdmin: boolean;
  hasMoreItemsFromServer: boolean;
  onLoadMoreItems: () => Promise<void>;
  appliedSearchFilter: string;
  renderHighlightedText: (text: string, term: string) => ReactNode;
  getAutorLabel: (item: Relatorio["itens"][number]) => string;
};

function RegistroDetalheTable({
  relatorio,
  isLoading,
  isLoadingMoreItems,
  isAdmin,
  hasMoreItemsFromServer,
  onLoadMoreItems,
  appliedSearchFilter,
  renderHighlightedText,
  getAutorLabel,
}: RegistroDetalheTableProps) {
  const items = relatorio?.itens ?? [];
  const { visibleCount, visibleItems, hasMore: hasMoreVisibleItems, showMore } = useIncrementalRender({
    items,
    initialCount: 40,
    step: 40,
  });

  const renderedRows = useMemo(() => {
    if (visibleItems.length === 0) {
      return null;
    }

    return visibleItems.map((item) => (
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
    ));
  }, [appliedSearchFilter, getAutorLabel, isAdmin, renderHighlightedText, visibleItems]);

  return (
    <>
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <Card>
            <TableSkeleton rows={4} columns={2} />
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <p className="text-sm text-text-700">Nenhum item neste registro.</p>
          </Card>
        ) : (
          visibleItems.map((item) => (
            <Card key={item.id} className="space-y-2">
              <p className="text-sm font-semibold text-text-900">{renderHighlightedText(item.empresa, appliedSearchFilter)}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-text-700">
                <p>Placa: {renderHighlightedText(item.placaVeiculo, appliedSearchFilter)}</p>
                <p>Nome: {renderHighlightedText(item.nome, appliedSearchFilter)}</p>
                <p>Perfil: {renderHighlightedText(perfilPessoaLabel(item.perfilPessoa), appliedSearchFilter)}</p>
                <p>Entrada: {renderHighlightedText(item.horaEntrada ?? "-", appliedSearchFilter)}</p>
                <p>Saida: {renderHighlightedText(item.horaSaida ?? "-", appliedSearchFilter)}</p>
                <p className="col-span-2">Autor: {renderHighlightedText(getAutorLabel(item), appliedSearchFilter)}</p>
              </div>
            </Card>
          ))
        )}
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Saida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Autor</th>
                {isAdmin ? <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Acoes</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                    <TableSkeleton rows={6} columns={isAdmin ? 8 : 7} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                    Nenhum item neste registro.
                  </td>
                </tr>
              ) : renderedRows}
            </tbody>
          </table>
        </div>
      </Card>

      {!isLoading && items.length > 0 ? (
        <Card className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-700">
              Mostrando {visibleCount} de {items.length} item(ns).
            </p>
            {hasMoreVisibleItems || hasMoreItemsFromServer ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full px-3 py-2 text-xs sm:w-auto"
                onClick={() => {
                  if (hasMoreVisibleItems) {
                    showMore();
                    return;
                  }

                  void onLoadMoreItems();
                }}
                disabled={isLoadingMoreItems}
              >
                {isLoadingMoreItems ? "Carregando..." : "Carregar mais"}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}
    </>
  );
}

export default memo(RegistroDetalheTable);

