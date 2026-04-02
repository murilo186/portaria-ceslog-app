import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../types/relatorio";

const mockSessao = {
  usuarioId: 1,
  relatorioId: 1,
  turno: "MANHA",
};

const initialFormValues: RelatorioItemEditableFields = {
  empresa: "",
  placaVeiculo: "",
  nome: "",
  horaEntrada: "",
  horaSaida: "",
  observacoes: "",
};

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function RelatorioPage() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<RelatorioItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [formValues, setFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);

  const resetForm = () => {
    setFormValues(initialFormValues);
    setEditingId(null);
  };

  const buildLocalItem = (payload: RelatorioItemEditableFields): RelatorioItem => {
    return {
      id: nextId,
      relatorioId: mockSessao.relatorioId,
      usuarioId: mockSessao.usuarioId,
      empresa: payload.empresa,
      placaVeiculo: payload.placaVeiculo,
      nome: payload.nome,
      horaEntrada: payload.horaEntrada || null,
      horaSaida: payload.horaSaida || null,
      observacoes: payload.observacoes || null,
      turno: mockSessao.turno,
      criadoEm: new Date().toISOString(),
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId !== null) {
      setItens((prevItens) =>
        prevItens.map((item) =>
          item.id === editingId
            ? {
                ...item,
                empresa: formValues.empresa,
                placaVeiculo: formValues.placaVeiculo,
                nome: formValues.nome,
                horaEntrada: formValues.horaEntrada || null,
                horaSaida: formValues.horaSaida || null,
                observacoes: formValues.observacoes || null,
              }
            : item,
        ),
      );
      resetForm();
      return;
    }

    const novoItem = buildLocalItem(formValues);
    setItens((prevItens) => [novoItem, ...prevItens]);
    setNextId((prevId) => prevId + 1);
    resetForm();
  };

  const handleEdit = (item: RelatorioItem) => {
    setEditingId(item.id);
    setFormValues({
      empresa: item.empresa,
      placaVeiculo: item.placaVeiculo,
      nome: item.nome,
      horaEntrada: item.horaEntrada ?? "",
      horaSaida: item.horaSaida ?? "",
      observacoes: item.observacoes ?? "",
    });
  };

  const handleDelete = (id: number) => {
    setItens((prevItens) => prevItens.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
  };

  const applyCurrentTime = (field: "horaEntrada" | "horaSaida") => {
    const currentTime = getCurrentTime();
    setFormValues((prevValues) => ({ ...prevValues, [field]: currentTime }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-1">
        <Button
          type="button"
          variant="secondary"
          className="mb-2 px-3 py-2 text-xs"
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-semibold text-text-900">Relatorio do Dia</h1>
        <p className="text-sm text-text-700">Cadastro local para testes do fluxo de relatorio.</p>
        <p className="text-xs text-text-700">Turno aplicado automaticamente: {mockSessao.turno}</p>
      </div>

      <Card>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            id="empresa"
            label="Empresa"
            value={formValues.empresa}
            onChange={(event) =>
              setFormValues((prevValues) => ({ ...prevValues, empresa: event.target.value }))
            }
            placeholder="Nome da empresa"
            required
          />

          <Input
            id="placaVeiculo"
            label="Placa do veiculo"
            value={formValues.placaVeiculo}
            onChange={(event) =>
              setFormValues((prevValues) => ({
                ...prevValues,
                placaVeiculo: event.target.value.toUpperCase(),
              }))
            }
            placeholder="ABC1D23"
            required
          />

          <Input
            id="nome"
            label="Nome"
            value={formValues.nome}
            onChange={(event) =>
              setFormValues((prevValues) => ({ ...prevValues, nome: event.target.value }))
            }
            placeholder="Nome da pessoa"
            required
          />

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="horaEntrada" className="text-sm font-medium text-text-700">
              Hora de entrada
            </label>
            <div className="flex gap-2">
              <input
                id="horaEntrada"
                type="time"
                value={formValues.horaEntrada}
                onChange={(event) =>
                  setFormValues((prevValues) => ({ ...prevValues, horaEntrada: event.target.value }))
                }
                className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-3 py-2 text-xs"
                onClick={() => applyCurrentTime("horaEntrada")}
              >
                Agora
              </Button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="horaSaida" className="text-sm font-medium text-text-700">
              Hora de saida
            </label>
            <div className="flex gap-2">
              <input
                id="horaSaida"
                type="time"
                value={formValues.horaSaida}
                onChange={(event) =>
                  setFormValues((prevValues) => ({ ...prevValues, horaSaida: event.target.value }))
                }
                className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-3 py-2 text-xs"
                onClick={() => applyCurrentTime("horaSaida")}
              >
                Agora
              </Button>
            </div>
          </div>

          <div className="sm:col-span-2 flex w-full flex-col gap-1.5">
            <label htmlFor="observacoes" className="text-sm font-medium text-text-700">
              Observacoes
            </label>
            <textarea
              id="observacoes"
              value={formValues.observacoes}
              onChange={(event) =>
                setFormValues((prevValues) => ({ ...prevValues, observacoes: event.target.value }))
              }
              rows={3}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="Informacoes adicionais"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" className="w-full sm:w-auto">
              {editingId !== null ? "Salvar alteracoes" : "Adicionar registro"}
            </Button>
            {editingId !== null ? (
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={resetForm}>
                Cancelar edicao
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="space-y-3 md:hidden">
        {itens.length === 0 ? (
          <Card>
            <p className="text-sm text-text-700">Nenhum registro adicionado ate o momento.</p>
          </Card>
        ) : (
          itens.map((item) => (
            <Card key={item.id} className="space-y-2">
              <p className="text-sm font-semibold text-text-900">{item.nome}</p>
              <p className="text-sm text-text-700">Empresa: {item.empresa}</p>
              <p className="text-sm text-text-700">Placa: {item.placaVeiculo}</p>
              <p className="text-sm text-text-700">Entrada: {item.horaEntrada ?? "-"}</p>
              <p className="text-sm text-text-700">Saida: {item.horaSaida ?? "-"}</p>
              <p className="text-sm text-text-700">Turno: {item.turno ?? "-"}</p>
              <p className="text-sm text-text-700">Obs: {item.observacoes ?? "-"}</p>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => handleEdit(item)}>
                  Editar
                </Button>
                <Button type="button" className="flex-1" onClick={() => handleDelete(item.id)}>
                  Excluir
                </Button>
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Saida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Turno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Observacoes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 bg-white">
              {itens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-text-700">
                    Nenhum registro adicionado ate o momento.
                  </td>
                </tr>
              ) : (
                itens.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-text-900">{item.empresa}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.placaVeiculo}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.nome}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaEntrada ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.horaSaida ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.turno ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-text-900">{item.observacoes ?? "-"}</td>
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
