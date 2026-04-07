import Card from "../../../components/Card";
import IconActionButton from "../../../components/IconActionButton";
import type { RelatorioItem } from "../../../types/relatorio";

type RelatorioMobileListProps = {
  isLoading: boolean;
  items: RelatorioItem[];
  isReadOnly: boolean;
  isSubmitting: boolean;
  canManageItem: (item: RelatorioItem) => boolean;
  onQuickSetSaida: (item: RelatorioItem) => Promise<void>;
  onEdit: (item: RelatorioItem) => void;
  onDelete: (item: RelatorioItem) => Promise<void>;
  getAutorLabel: (item: RelatorioItem) => string;
  perfilPessoaLabel: (perfil: RelatorioItem["perfilPessoa"]) => string;
};

export default function RelatorioMobileList({
  isLoading,
  items,
  isReadOnly,
  isSubmitting,
  canManageItem,
  onQuickSetSaida,
  onEdit,
  onDelete,
  getAutorLabel,
  perfilPessoaLabel,
}: RelatorioMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {isLoading ? (
        <Card>
          <p className="text-sm text-text-700">Carregando...</p>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-text-700">Nenhum registro adicionado até o momento.</p>
        </Card>
      ) : (
        items.map((item) => {
          const canManage = canManageItem(item) && !isReadOnly;

          return (
            <Card key={item.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text-900">{item.empresa}</p>
                {canManage ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-md border border-surface-200 px-2 py-1 text-[11px] font-medium text-text-700 hover:bg-surface-50"
                      onClick={() => void onQuickSetSaida(item)}
                      disabled={isSubmitting}
                    >
                      Saída agora
                    </button>
                    <IconActionButton
                      action="edit"
                      label="Editar registro"
                      className="h-8 w-8 border-0 bg-transparent hover:bg-surface-50"
                      onClick={() => onEdit(item)}
                      disabled={isSubmitting}
                    />
                    <IconActionButton
                      action="delete"
                      label="Excluir registro"
                      className="h-8 w-8 border-0 bg-transparent hover:bg-red-50"
                      onClick={() => void onDelete(item)}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <p className="text-sm text-text-700">Nome: {item.nome}</p>
                <p className="text-sm text-text-700">Placa: {item.placaVeiculo}</p>
                <p className="text-sm text-text-700">Entrada: {item.horaEntrada ?? "-"}</p>
                <p className="text-sm text-text-700">Saída: {item.horaSaida ?? "-"}</p>
                <p className="text-sm text-text-700">Perfil: {perfilPessoaLabel(item.perfilPessoa)}</p>
                <p className="text-sm text-text-700">Turno: {item.turno ?? "-"}</p>
                <p className="col-span-2 text-sm text-text-700">Autor: {getAutorLabel(item)}</p>
              </div>

              {!canManage ? (
                <p className="pt-1 text-xs text-text-700">Somente autor/admin pode editar este item.</p>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}
