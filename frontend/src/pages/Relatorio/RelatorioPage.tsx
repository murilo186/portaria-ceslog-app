import { useState, type FormEvent } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import type { RelatorioItem } from "../../types/relatorio";

const colunas = ["Horário", "Ocorrência", "Responsável", "Turno", "Ações"];
const turnos = ["Manhã", "Tarde", "Noite"] as const;

type FormValues = {
  horario: string;
  descricao: string;
  responsavel: string;
  turno: (typeof turnos)[number];
};

const initialFormValues: FormValues = {
  horario: "",
  descricao: "",
  responsavel: "",
  turno: "Manhã",
};

export default function RelatorioPage() {
  const [itens, setItens] = useState<RelatorioItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);

  const resetForm = () => {
    setFormValues(initialFormValues);
    setEditingId(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId) {
      setItens((prevItens) =>
        prevItens.map((item) =>
          item.id === editingId
            ? {
                ...item,
                horario: formValues.horario,
                descricao: formValues.descricao,
                responsavel: formValues.responsavel,
                turno: formValues.turno,
              }
            : item,
        ),
      );

      resetForm();
      return;
    }

    const novoItem: RelatorioItem = {
      id: crypto.randomUUID(),
      relatorioId: "relatorio-local",
      horario: formValues.horario,
      descricao: formValues.descricao,
      responsavel: formValues.responsavel,
      turno: formValues.turno,
      usuarioId: "usuario-local",
      criadoEm: new Date().toISOString(),
    };

    setItens((prevItens) => [novoItem, ...prevItens]);
    resetForm();
  };

  const handleEdit = (item: RelatorioItem) => {
    setEditingId(item.id);
    setFormValues({
      horario: item.horario,
      descricao: item.descricao,
      responsavel: item.responsavel,
      turno: item.turno as FormValues["turno"],
    });
  };

  const handleDelete = (id: string) => {
    setItens((prevItens) => prevItens.filter((item) => item.id !== id));

    if (editingId === id) {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-900">Relatório do Dia</h1>
          <p className="text-sm text-text-700">Registros operacionais diários da portaria.</p>
        </div>
      </div>

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            id="horario"
            label="Horário"
            type="time"
            value={formValues.horario}
            onChange={(event) =>
              setFormValues((prevValues) => ({ ...prevValues, horario: event.target.value }))
            }
            required
          />

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="turno" className="text-sm font-medium text-text-700">
              Turno
            </label>
            <select
              id="turno"
              value={formValues.turno}
              onChange={(event) =>
                setFormValues((prevValues) => ({
                  ...prevValues,
                  turno: event.target.value as FormValues["turno"],
                }))
              }
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              {turnos.map((turno) => (
                <option key={turno} value={turno}>
                  {turno}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="descricao"
            label="Ocorrência"
            value={formValues.descricao}
            onChange={(event) =>
              setFormValues((prevValues) => ({ ...prevValues, descricao: event.target.value }))
            }
            placeholder="Descreva a ocorrência"
            required
          />

          <Input
            id="responsavel"
            label="Responsável"
            value={formValues.responsavel}
            onChange={(event) =>
              setFormValues((prevValues) => ({ ...prevValues, responsavel: event.target.value }))
            }
            placeholder="Nome do responsável"
            required
          />

          <div className="flex items-center gap-3 md:col-span-2">
            <Button type="submit">{editingId ? "Salvar alterações" : "Adicionar novo registro"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                {colunas.map((coluna) => (
                  <th
                    key={coluna}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700"
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-700">
                    Nenhum registro adicionado até o momento.
                  </td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horario}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.descricao}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.responsavel}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.turno}</td>
                    <td className="px-4 py-3 text-sm text-text-900">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => handleEdit(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          onClick={() => handleDelete(item.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
