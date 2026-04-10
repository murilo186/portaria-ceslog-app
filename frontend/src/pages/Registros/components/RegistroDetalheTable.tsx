import Card from "../../../components/Card";
import IconActionButton from "../../../components/IconActionButton";
import { perfilPessoaLabel } from "../../../utils/perfilPessoa";
import type { Relatorio } from "../../../types/relatorio";
import type { ReactNode } from "react";

type RegistroDetalheTableProps = {
  relatorio: Relatorio | null;
  isLoading: boolean;
  isAdmin: boolean;
  appliedSearchFilter: string;
  renderHighlightedText: (text: string, term: string) => ReactNode;
  getAutorLabel: (item: Relatorio["itens"][number]) => string;
};

export default function RegistroDetalheTable({
  relatorio,
  isLoading,
  isAdmin,
  appliedSearchFilter,
  renderHighlightedText,
  getAutorLabel,
}: RegistroDetalheTableProps) {
  return (
    <Card className="p-0">
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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Autor</th>
              {isAdmin ? <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Ações</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                  Carregando...
                </td>
              </tr>
            ) : !relatorio || relatorio.itens.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-text-700">
                  Nenhum item neste registro.
                </td>
              </tr>
            ) : (
              relatorio.itens.map((item) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}