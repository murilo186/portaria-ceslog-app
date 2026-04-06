import {
  createRelatorioItem,
  deleteRelatorioItem,
  fecharRelatorio,
  getRelatorioAberto,
  updateRelatorioItem,
} from "../../services/relatorioService";
import { getAuthSession } from "../../services/authStorage";
import { ApiError } from "../../services/api";
import { getUserErrorMessage } from "../../services/errorService";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import StatusBadge from "../../components/StatusBadge";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../types/relatorio";
import type { Usuario } from "../../types/usuario";
import { PERFIL_PESSOA_OPTIONS, perfilPessoaLabel } from "../../utils/perfilPessoa";
import { formatPlacaInput, normalizeRelatorioPayload, validateRelatorioPayload } from "../../utils/relatorioForm";

const initialFormValues: RelatorioItemEditableFields = {
  perfilPessoa: "VISITANTE",
  empresa: "",
  placaVeiculo: "",
  nome: "",
  horaEntrada: "",
  horaSaida: "",
  observacoes: "",
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

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
        const relatorio = await getRelatorioAberto(authSession.token);
        setRelatorioId(relatorio.id);
        setRelatorioStatus(relatorio.status);
        setItens(relatorio.itens);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          navigate("/dashboard", {
            replace: true,
            state: { message: "Não existe relatório em aberto para continuar." },
          });
          return;
        }

        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Erro ao carregar relatório"),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadRelatorio();
  }, [navigate]);

  const isReadOnly = relatorioStatus === "FECHADO";

  const sortedItens = useMemo(() => {
    return [...itens].sort((a, b) => b.id - a.id);
  }, [itens]);

  const resetCreateForm = () => {
    setFormValues(initialFormValues);
  };

  const canManageItem = (item: RelatorioItem): boolean => {
    if (!usuarioLogado) {
      return false;
    }

    if (usuarioLogado.perfil === "ADMIN") {
      return true;
    }

    return item.usuarioId === usuarioLogado.id;
  };

  const applyCurrentTime = (field: "horaEntrada" | "horaSaida", mode: "create" | "edit") => {
    const currentTime = getCurrentTime();

    if (mode === "create") {
      setFormValues((prevValues) => ({ ...prevValues, [field]: currentTime }));
      return;
    }

    setEditFormValues((prevValues) => ({ ...prevValues, [field]: currentTime }));
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    const normalizedPayload = normalizeRelatorioPayload(formValues);
    const errors = validateRelatorioPayload(normalizedPayload);

    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" ") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const createdItem = await createRelatorioItem(relatorioId, normalizedPayload, token);
      setItens((prevItens) => [createdItem, ...prevItens]);
      resetCreateForm();
      setFeedback({ type: "success", message: "Registro adicionado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao criar item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (item: RelatorioItem) => {
    if (isReadOnly) {
      setFeedback({ type: "error", message: "Relatório fechado. Edição indisponível." });
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode editar registros da sua autoria." });
      return;
    }

    setEditingItemId(item.id);
    setEditFormValues({
      perfilPessoa: item.perfilPessoa,
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

    if (!token || !relatorioId || editingItemId === null || isReadOnly) {
      return;
    }

    const normalizedPayload = normalizeRelatorioPayload(editFormValues);
    const errors = validateRelatorioPayload(normalizedPayload);

    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" ") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedItem = await updateRelatorioItem(relatorioId, editingItemId, normalizedPayload, token);
      setItens((prevItens) => prevItens.map((item) => (item.id === editingItemId ? updatedItem : item)));
      handleCloseEditModal();
      setFeedback({ type: "success", message: "Registro atualizado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode excluir registros da sua autoria." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await deleteRelatorioItem(relatorioId, item.id, token);
      setItens((prevItens) => prevItens.filter((currentItem) => currentItem.id !== item.id));
      if (editingItemId === item.id) {
        handleCloseEditModal();
      }
      setFeedback({ type: "success", message: "Registro excluído com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao excluir item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseRelatorio = async () => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    const shouldClose = window.confirm(
      "Tem certeza que deseja fechar o relatório? Depois disso ele ficará somente leitura.",
    );

    if (!shouldClose) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const closed = await fecharRelatorio(relatorioId, token);
      setRelatorioStatus(closed.status);
      setFeedback({ type: "success", message: "Relatório fechado com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao fechar relatório"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Button
              type="button"
              className="px-3 py-2 text-xs"
              onClick={() => void handleCloseRelatorio()}
              disabled={isSubmitting || isLoading || isReadOnly}
            >
              {isReadOnly ? "Relatório fechado" : "Fechar relatório"}
            </Button>
            <StatusBadge status={relatorioStatus} />
          </div>

          <h1 className="text-2xl font-semibold text-text-900">Relatório do Dia</h1>
          <p className="text-sm text-text-700">Cadastro integrado ao backend.</p>
          <p className="text-xs text-text-700">Turno aplicado automaticamente: {turnoAtual}</p>
          {usuarioLogado ? <p className="text-xs text-text-700">Autor automático: {usuarioLogado.nome}</p> : null}
          {isReadOnly ? <p className="text-sm font-semibold text-amber-700">Relatório fechado: somente leitura.</p> : null}

          {feedback ? (
            <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
              {feedback.message}
            </p>
          ) : null}
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
              disabled={isReadOnly}
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
              <div className="flex gap-2">
                <input
                  id="horaEntrada"
                  type="time"
                  value={formValues.horaEntrada ?? ""}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, horaEntrada: event.target.value }))}
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  disabled={isReadOnly}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-3 py-2 text-xs"
                  onClick={() => applyCurrentTime("horaEntrada", "create")}
                  disabled={isReadOnly}
                >
                  Agora
                </Button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="horaSaida" className="text-sm font-medium text-text-700">
                Hora de saída
              </label>
              <div className="flex gap-2">
                <input
                  id="horaSaida"
                  type="time"
                  value={formValues.horaSaida ?? ""}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  disabled={isReadOnly}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 px-3 py-2 text-xs"
                  onClick={() => applyCurrentTime("horaSaida", "create")}
                  disabled={isReadOnly}
                >
                  Agora
                </Button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
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

            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center">
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isLoading || isReadOnly}>
                {isReadOnly ? "Relatório fechado" : "Adicionar registro"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <Card>
              <p className="text-sm text-text-700">Carregando...</p>
            </Card>
          ) : sortedItens.length === 0 ? (
            <Card>
              <p className="text-sm text-text-700">Nenhum registro adicionado até o momento.</p>
            </Card>
          ) : (
            sortedItens.map((item) => {
              const canManage = canManageItem(item) && !isReadOnly;

              return (
                <Card key={item.id} className="space-y-2">
                  <p className="text-sm font-semibold text-text-900">{item.nome}</p>
                  <p className="text-sm text-text-700">Empresa: {item.empresa}</p>
                  <p className="text-sm text-text-700">Placa: {item.placaVeiculo}</p>
                  <p className="text-sm text-text-700">Perfil: {perfilPessoaLabel(item.perfilPessoa)}</p>
                  <p className="text-sm text-text-700">Entrada: {item.horaEntrada ?? "-"}</p>
                  <p className="text-sm text-text-700">Saída: {item.horaSaida ?? "-"}</p>
                  <p className="text-sm text-text-700">Turno: {item.turno ?? "-"}</p>
                  <p className="text-sm text-text-700">Autor: {getAutorLabel(item, usuarioLogado)}</p>
                  <p className="text-sm text-text-700">Obs.: {item.observacoes ?? "-"}</p>

                  {canManage ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleOpenEditModal(item)}
                        disabled={isSubmitting}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => void handleDelete(item)}
                        disabled={isSubmitting}
                      >
                        Excluir
                      </Button>
                    </div>
                  ) : (
                    <p className="pt-1 text-xs text-text-700">Somente autor/admin pode editar este item.</p>
                  )}
                </Card>
              );
            })
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
                      Carregando...
                    </td>
                  </tr>
                ) : sortedItens.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-text-700">
                      Nenhum registro adicionado até o momento.
                    </td>
                  </tr>
                ) : (
                  sortedItens.map((item) => {
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
                        <td className="px-4 py-3 text-sm text-text-900">{getAutorLabel(item, usuarioLogado)}</td>
                        <td className="px-4 py-3 text-sm text-text-900">{item.observacoes ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text-900">
                          {canManage ? (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={() => handleOpenEditModal(item)}
                                disabled={isSubmitting}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                className="px-3 py-1.5 text-xs"
                                onClick={() => void handleDelete(item)}
                                disabled={isSubmitting}
                              >
                                Excluir
                              </Button>
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
        </Card>
      </div>

      {isEditModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-lg border border-surface-200 bg-white p-5 sm:p-6">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-text-900">Editar registro</h2>
              <p className="text-sm text-text-700">Atualize os dados e salve as alterações.</p>
            </div>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleEditSubmit}>
              <Input
                id="edit-empresa"
                label="Empresa"
                value={editFormValues.empresa ?? ""}
                onChange={(event) => setEditFormValues((prev) => ({ ...prev, empresa: event.target.value }))}
                required
                disabled={isReadOnly}
              />
              <Input
                id="edit-placaVeiculo"
                label="Placa do veículo"
                value={editFormValues.placaVeiculo ?? ""}
                onChange={(event) =>
                  setEditFormValues((prev) => ({ ...prev, placaVeiculo: formatPlacaInput(event.target.value) }))
                }
                required
                disabled={isReadOnly}
              />
              <Input
                id="edit-nome"
                label="Nome"
                value={editFormValues.nome ?? ""}
                onChange={(event) => setEditFormValues((prev) => ({ ...prev, nome: event.target.value }))}
                required
                disabled={isReadOnly}
              />

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="edit-perfilPessoa" className="text-sm font-medium text-text-700">
                  Perfil da pessoa
                </label>
                <select
                  id="edit-perfilPessoa"
                  value={editFormValues.perfilPessoa}
                  onChange={(event) =>
                    setEditFormValues((prev) => ({
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
                <label htmlFor="edit-horaEntrada" className="text-sm font-medium text-text-700">
                  Hora de entrada
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-horaEntrada"
                    type="time"
                    value={editFormValues.horaEntrada ?? ""}
                    onChange={(event) =>
                      setEditFormValues((prev) => ({ ...prev, horaEntrada: event.target.value }))
                    }
                    className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    disabled={isReadOnly}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 px-3 py-2 text-xs"
                    onClick={() => applyCurrentTime("horaEntrada", "edit")}
                    disabled={isReadOnly}
                  >
                    Agora
                  </Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5">
                <label htmlFor="edit-horaSaida" className="text-sm font-medium text-text-700">
                  Hora de saída
                </label>
                <div className="flex gap-2">
                  <input
                    id="edit-horaSaida"
                    type="time"
                    value={editFormValues.horaSaida ?? ""}
                    onChange={(event) => setEditFormValues((prev) => ({ ...prev, horaSaida: event.target.value }))}
                    className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    disabled={isReadOnly}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 px-3 py-2 text-xs"
                    onClick={() => applyCurrentTime("horaSaida", "edit")}
                    disabled={isReadOnly}
                  >
                    Agora
                  </Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="edit-observacoes" className="text-sm font-medium text-text-700">
                  Observações
                </label>
                <textarea
                  id="edit-observacoes"
                  value={editFormValues.observacoes ?? ""}
                  onChange={(event) =>
                    setEditFormValues((prev) => ({ ...prev, observacoes: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  disabled={isReadOnly}
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={handleCloseEditModal}
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
      ) : null}
    </>
  );
}







