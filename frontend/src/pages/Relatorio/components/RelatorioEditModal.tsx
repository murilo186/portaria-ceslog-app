import Button from "../../../components/Button";
import Input from "../../../components/Input";
import SelectField from "../../../components/SelectField";
import TextareaField from "../../../components/TextareaField";
import type { RelatorioItemEditableFields } from "../../../types/relatorio";
import { PERFIL_PESSOA_OPTIONS } from "../../../utils/perfilPessoa";
import { formatPlacaInput } from "../../../utils/relatorioForm";
import type { Dispatch, FormEvent, SetStateAction } from "react";

type RelatorioEditModalProps = {
  isOpen: boolean;
  isReadOnly: boolean;
  isSubmitting: boolean;
  values: RelatorioItemEditableFields;
  setValues: Dispatch<SetStateAction<RelatorioItemEditableFields>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function RelatorioEditModal({
  isOpen,
  isReadOnly,
  isSubmitting,
  values,
  setValues,
  onClose,
  onSubmit,
}: RelatorioEditModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-lg border border-surface-200 bg-white p-5 sm:p-6">
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold text-text-900">Editar registro</h2>
          <p className="text-sm text-text-700">Atualize os dados e salve as alterações.</p>
        </div>

        <form className="grid grid-cols-2 gap-3 sm:gap-4" onSubmit={onSubmit}>
          <Input
            id="edit-empresa"
            label="Empresa"
            value={values.empresa ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, empresa: event.target.value }))}
            required
            disabled={isReadOnly}
          />

          <Input
            id="edit-placaVeiculo"
            label="Placa do veículo"
            value={values.placaVeiculo ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, placaVeiculo: formatPlacaInput(event.target.value) }))}
            required
            disabled={isReadOnly}
          />

          <Input
            id="edit-nome"
            label="Nome"
            value={values.nome ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, nome: event.target.value }))}
            required
            disabled={isReadOnly}
          />

          <SelectField
            id="edit-perfilPessoa"
            label="Perfil da pessoa"
            value={values.perfilPessoa}
            onChange={(event) =>
              setValues((prev) => ({
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
            id="edit-horaEntrada"
            type="time"
            label="Hora de entrada"
            value={values.horaEntrada ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, horaEntrada: event.target.value }))}
            disabled={isReadOnly}
          />

          <Input
            id="edit-horaSaida"
            type="time"
            label="Hora de saída"
            value={values.horaSaida ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
            disabled={isReadOnly}
          />

          <div className="col-span-2">
            <TextareaField
              id="edit-observacoes"
              label="Observações"
              value={values.observacoes ?? ""}
              onChange={(event) => setValues((prev) => ({ ...prev, observacoes: event.target.value }))}
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          <div className="col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onClose}
              disabled={isSubmitting || isReadOnly}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isReadOnly}>
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}