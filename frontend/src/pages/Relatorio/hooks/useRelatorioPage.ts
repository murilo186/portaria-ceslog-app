import {
  createRelatorioItem,
  deleteRelatorioItem,
  getRelatorioAberto,
  getRelatorioClock,
  setRelatorioClockSimulation,
  updateRelatorioItem,
} from "../../../services/relatorioService";
import { getAuthSession } from "../../../services/authStorage";
import { ApiError } from "../../../services/api";
import { getUserErrorMessage } from "../../../services/errorService";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RelatorioItem, RelatorioItemEditableFields } from "../../../types/relatorio";
import type { Usuario } from "../../../types/usuario";
import { normalizeRelatorioPayload, validateRelatorioPayload } from "../../../utils/relatorioForm";
import type { FeedbackState } from "../types";

const initialFormValues: RelatorioItemEditableFields = {
  perfilPessoa: "VISITANTE",
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

export function useRelatorioPage() {
  const navigate = useNavigate();

  const [itens, setItens] = useState<RelatorioItem[]>([]);
  const [relatorioId, setRelatorioId] = useState<number | null>(null);
  const [clockBusinessKey, setClockBusinessKey] = useState<string | null>(null);
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
  const [countdownMinutes, setCountdownMinutes] = useState<number | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [clockSimulationStart, setClockSimulationStart] = useState<string | null>(null);
  const autoRedirectTriggeredRef = useRef(false);
  const showSimulationControls = import.meta.env.DEV;

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
        setClockBusinessKey(null);
        autoRedirectTriggeredRef.current = false;
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

  useEffect(() => {
    if (!token || !relatorioId || relatorioStatus === "FECHADO") {
      return;
    }

    let cancelled = false;

    const syncClock = async () => {
      try {
        const snapshot = await getRelatorioClock(token);

        if (cancelled) {
          return;
        }

        setClockSimulationStart(snapshot.simulationEnabled ? snapshot.simulationStart : null);

        if (snapshot.showCountdown) {
          const totalSeconds = Math.max(0, Math.ceil(snapshot.msToMidnight / 1000));
          setCountdownMinutes(Math.floor(totalSeconds / 60));
          setCountdownSeconds(totalSeconds % 60);
        } else {
          setCountdownMinutes(null);
          setCountdownSeconds(null);
        }

        if (!clockBusinessKey) {
          setClockBusinessKey(snapshot.businessDateKey);
          return;
        }

        const viradaDetectada = snapshot.businessDateKey !== clockBusinessKey;
        if (viradaDetectada && !autoRedirectTriggeredRef.current) {
          autoRedirectTriggeredRef.current = true;
          setRelatorioStatus("FECHADO");
          setFeedback({
            type: "success",
            message: "Relatório fechado automaticamente à meia-noite. Redirecionando...",
          });

          window.setTimeout(() => {
            navigate("/dashboard", {
              replace: true,
              state: { message: "Relatório anterior fechado automaticamente à meia-noite." },
            });
          }, 800);
        }
      } catch {
        setCountdownMinutes(null);
        setCountdownSeconds(null);
      }
    };

    void syncClock();
    const intervalId = window.setInterval(() => {
      void syncClock();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [clockBusinessKey, navigate, relatorioId, relatorioStatus, token]);

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

  const handleQuickSetSaida = async (item: RelatorioItem) => {
    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    if (!canManageItem(item)) {
      setFeedback({ type: "error", message: "Você só pode editar registros da sua autoria." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload: RelatorioItemEditableFields = {
        perfilPessoa: item.perfilPessoa,
        empresa: item.empresa,
        placaVeiculo: item.placaVeiculo,
        nome: item.nome,
        horaEntrada: item.horaEntrada ?? getCurrentTime(),
        horaSaida: getCurrentTime(),
        observacoes: item.observacoes ?? "",
      };

      const updatedItem = await updateRelatorioItem(relatorioId, item.id, payload, token);
      setItens((prevItens) => prevItens.map((currentItem) => (currentItem.id === item.id ? updatedItem : currentItem)));
      setFeedback({ type: "success", message: "Saída atualizada com sucesso." });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Erro ao atualizar horário de saída"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateClockStart = async () => {
    const start = "23:58";

    if (!token || !relatorioId || isReadOnly) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const snapshot = await setRelatorioClockSimulation(start, token);
      setClockBusinessKey(snapshot.businessDateKey);
      setClockSimulationStart(snapshot.simulationStart);

      if (snapshot.showCountdown) {
        const totalSeconds = Math.max(0, Math.ceil(snapshot.msToMidnight / 1000));
        setCountdownMinutes(Math.floor(totalSeconds / 60));
        setCountdownSeconds(totalSeconds % 60);
      } else {
        setCountdownMinutes(null);
        setCountdownSeconds(null);
      }

      setFeedback({ type: "success", message: `Horário simulado ajustado para ${start}.` });
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Não foi possível ajustar o horário de simulação."),
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
