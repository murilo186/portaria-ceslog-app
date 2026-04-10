import Button from "../../../components/Button";
import Card from "../../../components/Card";
import Input from "../../../components/Input";
import SelectField from "../../../components/SelectField";
import TextareaField from "../../../components/TextareaField";
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

        <SelectField
          id="perfilPessoa"
          label="Perfil da pessoa"
          value={formValues.perfilPessoa}
          onChange={(event) =>
            setFormValues((prev) => ({
              ...prev,
              perfilPessoa: event.target.value as RelatorioItemEditableFields["perfilPessoa"],
            }))
          }
          disabled={isReadOnly}
        >
          {PERFIL_PESSOA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <Input
          id="horaEntrada"
          type="time"
          label="Hora de entrada"
          value={formValues.horaEntrada ?? ""}
          onChange={(event) => setFormValues((prev) => ({ ...prev, horaEntrada: event.target.value }))}
          disabled={isReadOnly}
        />

        <Input
          id="horaSaida"
          type="time"
          label="Hora de saída"
          value={formValues.horaSaida ?? ""}
          onChange={(event) => setFormValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
          disabled={isReadOnly}
        />

        <div className="col-span-2">
          <TextareaField
            id="observacoes"
            label="Observações"
            value={formValues.observacoes ?? ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, observacoes: event.target.value }))}
            rows={3}
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