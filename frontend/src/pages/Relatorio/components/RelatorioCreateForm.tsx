import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Input from "../../../components/Input";
import type { RelatorioItemEditableFields } from "../../../types/relatorio";
import { PERFIL_PESSOA_OPTIONS } from "../../../utils/perfilPessoa";
import { formatPlacaInput } from "../../../utils/relatorioForm";
import type { Dispatch, FormEvent, KeyboardEvent, SetStateAction } from "react";

type RelatorioCreateFormProps = {
  formValues: RelatorioItemEditableFields;
  isReadOnly: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLFormElement>) => void;
  setFormValues: Dispatch<SetStateAction<RelatorioItemEditableFields>>;
};

export default function RelatorioCreateForm({
  formValues,
  isReadOnly,
  isSubmitting,
  isLoading,
  onSubmit,
  onKeyDown,
  setFormValues,
}: RelatorioCreateFormProps) {
  return (
    <Card>
      <form className="grid grid-cols-2 gap-3 sm:gap-4" onSubmit={onSubmit} onKeyDown={onKeyDown}>
        <Input
          id="empresa"
          label="Empresa"
          value={formValues.empresa}
          onChange={(event) => setFormValues((prev) => ({ ...prev, empresa: event.target.value }))}
          placeholder="Nome da empresa"
          required
          disabled={isReadOnly}
          autoFocus
        />

        <Input
          id="placaVeiculo"
          label="Placa do veículo"
          value={formValues.placaVeiculo}
          onChange={(event) =>
            setFormValues((prev) => ({ ...prev, placaVeiculo: formatPlacaInput(event.target.value) }))
          }
          placeholder="ABC-1D23"
          required
          disabled={isReadOnly}
        />

        <Input
          id="nome"
          label="Nome"
          value={formValues.nome}
          onChange={(event) => setFormValues((prev) => ({ ...prev, nome: event.target.value }))}
          placeholder="Nome da pessoa"
          required
          disabled={isReadOnly}
        />

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="perfilPessoa" className="text-sm font-medium text-text-700">
            Perfil da pessoa
          </label>
          <select
            id="perfilPessoa"
            value={formValues.perfilPessoa}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                perfilPessoa: event.target.value as RelatorioItemEditableFields["perfilPessoa"],
              }))
            }
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            disabled={isReadOnly}
          >
            {PERFIL_PESSOA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="horaEntrada" className="text-sm font-medium text-text-700">
            Hora de entrada
          </label>
          <input
            id="horaEntrada"
            type="time"
            value={formValues.horaEntrada ?? ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, horaEntrada: event.target.value }))}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            disabled={isReadOnly}
          />
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <label htmlFor="horaSaida" className="text-sm font-medium text-text-700">
            Hora de saída
          </label>
          <input
            id="horaSaida"
            type="time"
            value={formValues.horaSaida ?? ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            disabled={isReadOnly}
          />
        </div>

        <div className="col-span-2 flex w-full flex-col gap-1.5">
          <label htmlFor="observacoes" className="text-sm font-medium text-text-700">
            Observações
          </label>
          <textarea
            id="observacoes"
            value={formValues.observacoes ?? ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, observacoes: event.target.value }))}
            rows={3}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="Informações adicionais"
            disabled={isReadOnly}
          />
        </div>

        <div className="col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoading || isReadOnly}>
            {isReadOnly ? "Relatório fechado" : "Salvar registro"}
          </Button>
          {!isReadOnly ? <p className="text-xs text-text-700">Atalho: Ctrl+Enter nas observações.</p> : null}
        </div>
      </form>
    </Card>
  );
}
