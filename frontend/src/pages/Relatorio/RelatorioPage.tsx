import {
  createRelatorioItem,
  deleteRelatorioItem,
  getRelatorioHoje,
  updateRelatorioItem,
} from "../../services/relatorioService";
import { getAuthSession } from "../../services/authStorage";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../types/relatorio";
import type { Usuario } from "../../types/usuario";

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

function getAutorLabel(item: RelatorioItem, fallbackUser: Usuario | null): string {
  if (item.usuario?.nome) {
    return item.usuario.nome;
  }

  if (fallbackUser) {
    return fallbackUser.nome;
  }

  return "-";
}

export default function RelatorioPage() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<RelatorioItem[]>([]);
  const [relatorioId, setRelatorioId] = useState<number | null>(null);
  const [relatorioStatus, setRelatorioStatus] = useState<"ABERTO" | "FECHADO">("ABERTO");
  const [turnoAtual, setTurnoAtual] = useState<string>("-");
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editFormValues, setEditFormValues] = useState<RelatorioItemEditableFields>(initialFormValues);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthSession();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setUsuarioLogado(authSession.usuario);
    setToken(authSession.token);
    setTurnoAtual(authSession.usuario.turno ?? "-");

    async function loadRelatorio() {
      try {
        const relatorio = await getRelatorioHoje(authSession.token);
        setRelatorioId(relatorio.id);
        setRelatorioStatus(relatorio.status);
        setItens(relatorio.itens);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar relatorio";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRelatorio();
  }, [navigate]);

  const resetCreateForm = () => {
    setFormValues(initialFormValues);
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || relatorioStatus === "FECHADO") {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdItem = await createRelatorioItem(relatorioId, formValues, token);
      setItens((prevItens) => [createdItem, ...prevItens]);
      resetCreateForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar item";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (item: RelatorioItem) => {
    setEditingItemId(item.id);
    setEditFormValues({
      empresa: item.empresa,
      placaVeiculo: item.placaVeiculo,
      nome: item.nome,
      horaEntrada: item.horaEntrada ?? "",
      horaSaida: item.horaSaida ?? "",
      observacoes: item.observacoes ?? "",
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
    setEditFormValues(initialFormValues);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || editingItemId === null || relatorioStatus === "FECHADO") {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updatedItem = await updateRelatorioItem(relatorioId, editingItemId, editFormValues, token);
      setItens((prevItens) => prevItens.map((item) => (item.id === editingItemId ? updatedItem : item)));
      handleCloseEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar item";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !relatorioId || relatorioStatus === "FECHADO") {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await deleteRelatorioItem(relatorioId, id, token);
      setItens((prevItens) => prevItens.filter((item) => item.id !== id));
      if (editingItemId === id) {
        handleCloseEditModal();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir item";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCurrentTime = (field: "horaEntrada" | "horaSaida", mode: "create" | "edit") => {
    const currentTime = getCurrentTime();

    if (mode === "create") {
      setFormValues((prevValues) => ({ ...prevValues, [field]: currentTime }));
      return;
    }

    setEditFormValues((prevValues) => ({ ...prevValues, [field]: currentTime }));
  };

  const isReadOnly = relatorioStatus === "FECHADO";

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <Button type="button" variant="secondary" className="mb-2 px-3 py-2 text-xs" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <h1 className="text-2xl font-semibold text-text-900">Relatorio do Dia</h1>
          <p className="text-sm text-text-700">Cadastro integrado ao backend.</p>
          <p className="text-xs text-text-700">Status do relatorio: {relatorioStatus}</p>
          <p className="text-xs text-text-700">Turno aplicado automaticamente: {turnoAtual}</p>
          {usuarioLogado ? <p className="text-xs text-text-700">Autor automatico: {usuarioLogado.nome}</p> : null}
          {isReadOnly ? <p className="text-sm font-semibold text-amber-700">Relatorio fechado: somente leitura.</p> : null}
          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        </div>

        <Card>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleCreateSubmit}>
            <Input
              id="empresa"
              label="Empresa"
              value={formValues.empresa}
              onChange={(event) => setFormValues((prev) => ({ ...prev, empresa: event.target.value }))}
              placeholder="Nome da empresa"
              required
            />

            <Input
              id="placaVeiculo"
              label="Placa do veiculo"
              value={formValues.placaVeiculo}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, placaVeiculo: event.target.value.toUpperCase() }))
              }
              placeholder="ABC1D23"
              required
            />

            <Input
              id="nome"
              label="Nome"
              value={formValues.nome}
              onChange={(event) => setFormValues((prev) => ({ ...prev, nome: event.target.value }))}
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
                  value={formValues.horaEntrada ?? ""}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, horaEntrada: event.target.value }))}
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <Button type="button" variant="secondary" className="shrink-0 px-3 py-2 text-xs" onClick={() => applyCurrentTime("horaEntrada", "create")}>Agora</Button>
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
                  value={formValues.horaSaida ?? ""}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <Button type="button" variant="secondary" className="shrink-0 px-3 py-2 text-xs" onClick={() => applyCurrentTime("horaSaida", "create")}>Agora</Button>
              </div>
            </div>

            <div className="sm:col-span-2 flex w-full flex-col gap-1.5">
              <label htmlFor="observacoes" className="text-sm font-medium text-text-700">
                Observacoes
              </label>
              <textarea
                id="observacoes"
                value={formValues.observacoes ?? ""}
                onChange={(event) => setFormValues((prev) => ({ ...prev, observacoes: event.target.value }))}
                rows={3}
                className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                placeholder="Informacoes adicionais"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoading || isReadOnly}>
                {isReadOnly ? "Relatorio fechado" : "Adicionar registro"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <Card><p className="text-sm text-text-700">Carregando...</p></Card>
          ) : itens.length === 0 ? (
            <Card><p className="text-sm text-text-700">Nenhum registro adicionado ate o momento.</p></Card>
          ) : (
            itens.map((item) => (
              <Card key={item.id} className="space-y-2">
                <p className="text-sm font-semibold text-text-900">{item.nome}</p>
                <p className="text-sm text-text-700">Empresa: {item.empresa}</p>
                <p className="text-sm text-text-700">Placa: {item.placaVeiculo}</p>
                <p className="text-sm text-text-700">Entrada: {item.horaEntrada ?? "-"}</p>
                <p className="text-sm text-text-700">Saida: {item.horaSaida ?? "-"}</p>
                <p className="text-sm text-text-700">Turno: {item.turno ?? "-"}</p>
                <p className="text-sm text-text-700">Autor: {getAutorLabel(item, usuarioLogado)}</p>
                <p className="text-sm text-text-700">Obs: {item.observacoes ?? "-"}</p>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => handleOpenEditModal(item)} disabled={isSubmitting || isReadOnly}>Editar</Button>
                  <Button type="button" className="flex-1" onClick={() => void handleDelete(item.id)} disabled={isSubmitting || isReadOnly}>Excluir</Button>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Autor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Observacoes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-700">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-text-700">Carregando...</td></tr>
                ) : itens.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-text-700">Nenhum registro adicionado ate o momento.</td></tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-text-900">{item.empresa}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.placaVeiculo}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.nome}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.horaEntrada ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.horaSaida ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.turno ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{getAutorLabel(item, usuarioLogado)}</td>
                      <td className="px-4 py-3 text-sm text-text-900">{item.observacoes ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text-900">
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => handleOpenEditModal(item)} disabled={isSubmitting || isReadOnly}>Editar</Button>
                          <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => void handleDelete(item.id)} disabled={isSubmitting || isReadOnly}>Excluir</Button>
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

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-lg border border-surface-200 bg-white p-5 sm:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-text-900">Editar registro</h2>
              <p className="text-sm text-text-700">Atualize os dados e salve as alteracoes.</p>
            </div>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleEditSubmit}>
              <Input id="edit-empresa" label="Empresa" value={editFormValues.empresa ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, empresa: e.target.value }))} required />
              <Input id="edit-placaVeiculo" label="Placa do veiculo" value={editFormValues.placaVeiculo ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, placaVeiculo: e.target.value.toUpperCase() }))} required />
              <Input id="edit-nome" label="Nome" value={editFormValues.nome ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, nome: e.target.value }))} required />

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="edit-horaEntrada" className="text-sm font-medium text-text-700">Hora de entrada</label>
                <div className="flex gap-2">
                  <input id="edit-horaEntrada" type="time" value={editFormValues.horaEntrada ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, horaEntrada: e.target.value }))} className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-2 text-xs" onClick={() => applyCurrentTime("horaEntrada", "edit")}>Agora</Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="edit-horaSaida" className="text-sm font-medium text-text-700">Hora de saida</label>
                <div className="flex gap-2">
                  <input id="edit-horaSaida" type="time" value={editFormValues.horaSaida ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, horaSaida: e.target.value }))} className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-2 text-xs" onClick={() => applyCurrentTime("horaSaida", "edit")}>Agora</Button>
                </div>
              </div>

              <div className="sm:col-span-2 flex w-full flex-col gap-1.5">
                <label htmlFor="edit-observacoes" className="text-sm font-medium text-text-700">Observacoes</label>
                <textarea id="edit-observacoes" value={editFormValues.observacoes ?? ""} onChange={(e) => setEditFormValues((p) => ({ ...p, observacoes: e.target.value }))} rows={3} className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={handleCloseEditModal} disabled={isSubmitting || isReadOnly}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isReadOnly}>Salvar alteracoes</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
