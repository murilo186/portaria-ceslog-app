import {
  createRelatorioItem,
  deleteRelatorioItem,
  getRelatorioAberto,
  updateRelatorioItem,
} from "../../../services/relatorioService";
import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import type { FeedbackState } from "../types";
import {
  buildQuickSetSaidaPayload,
  getAutorLabel,
  getCurrentTime,
  initialFormValues,
  mapItemToFormValues,
} from "./relatorioPageHelpers";
import { useRelatorioClock } from "./useRelatorioClock";

export function useRelatorioPage() {
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
  const showSimulationControls = import.meta.env.DEV;
  const { countdownMinutes, countdownSeconds, clockSimulationStart, startSimulation, defaultSimulationStart } =
    useRelatorioClock({
      token,
      relatorioId,
      relatorioStatus,
      setRelatorioStatus,
      setFeedback,
    });

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
            state: { message: "NÃ£o existe relatÃ³rio em aberto para continuar." },
          });
          return;
        }

        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Erro ao carregar relatÃ³rio"),
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

  const canManageItem = (item: RelatorioItem): boolean => {
    if (!usuarioLogado) {
      return false;
    }

    if (usuarioLogado.perfil === "ADMIN") {
      return true;
    }

    return item.usuarioId === usuarioLogado.id;
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    const normalizedPayload = normalizeRelatorioPayload(formValues);
    const payloadToCreate: RelatorioItemEditableFields = {
      ...normalizedPayload,
      horaEntrada: normalizedPayload.horaEntrada?.trim() ? normalizedPayload.horaEntrada : getCurrentTime(),
    };
    const errors = validateRelatorioPayload(payloadToCreate);

    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" ") });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const createdItem = await createRelatorioItem(relatorioId, payloadToCreate, token);
      setItens((prevItens) => [createdItem, ...prevItens]);
      setFormValues(initialFormValues);
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

  const handleCreateFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.tagName !== "TEXTAREA") {
      return;
    }

    event.preventDefault();
    event.currentTarget.requestSubmit();
  };

  const handleOpenEditModal = (item: RelatorioItem) => {
    if (isReadOnly) {
      setFeedback({ type: "error", message: "RelatÃ³rio fechado. EdiÃ§Ã£o indisponÃ­vel." });
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "VocÃª sÃ³ pode editar registros da sua autoria." });
      return;
    }

    setEditingItemId(item.id);
    setEditFormValues(mapItemToFormValues(item));
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
      setFeedback({ type: "error", message: "VocÃª sÃ³ pode excluir registros da sua autoria." });
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
      setFeedback({ type: "success", message: "Registro excluÃ­do com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao excluir item"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSetSaida = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "VocÃª sÃ³ pode editar registros da sua autoria." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = buildQuickSetSaidaPayload(item);
      const updatedItem = await updateRelatorioItem(relatorioId, item.id, payload, token);
      setItens((prevItens) => prevItens.map((currentItem) => (currentItem.id === item.id ? updatedItem : currentItem)));
      setFeedback({ type: "success", message: "SaÃ­da atualizada com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar horÃ¡rio de saÃ­da"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateClockStart = async () => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const snapshot = await startSimulation(defaultSimulationStart);

      if (!snapshot) {
        return;
      }

      setFeedback({
        type: "success",
        message: `HorÃ¡rio simulado ajustado para ${defaultSimulationStart}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "NÃ£o foi possÃ­vel ajustar o horÃ¡rio de simulaÃ§Ã£o."),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAutorLabelForItem = (item: RelatorioItem) => getAutorLabel(item, usuarioLogado);

  return {
    showSimulationControls,
    isSubmitting,
    isLoading,
    isReadOnly,
    relatorioStatus,
    turnoAtual,
    usuarioNome: usuarioLogado?.nome ?? null,
    countdownMinutes,
    countdownSeconds,
    clockSimulationStart,
    feedback,
    formValues,
    setFormValues,
    handleCreateSubmit,
    handleCreateFormKeyDown,
    sortedItens,
    canManageItem,
    handleQuickSetSaida,
    handleOpenEditModal,
    handleDelete,
    getAutorLabelForItem,
    isEditModalOpen,
    editFormValues,
    setEditFormValues,
    handleCloseEditModal,
    handleEditSubmit,
    handleSimulateClockStart,
  };
}
