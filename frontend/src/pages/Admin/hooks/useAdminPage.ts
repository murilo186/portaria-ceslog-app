import { getAuthSession } from "../../../services/authStorage";
import { getUserErrorMessage } from "../../../services/errorService";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { createUsuario, deleteUsuario, listAuditLogs, listUsuarios } from "../../../services/usuarioService";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RelatorioResumo } from "../../../types/relatorio";
import type { AuditLogItem, TurnoUsuario, UsuarioAdminListItem } from "../../../types/usuario";

export type Feedback = {
  type: "error" | "success";
  message: string;
};

type NovoUsuarioForm = {
  nome: string;
  usuario: string;
  senha: string;
  turno: TurnoUsuario;
};

const initialNovoUsuarioForm: NovoUsuarioForm = {
  nome: "",
  usuario: "",
  senha: "",
  turno: "MANHA",
};

export function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(dateIso));
}

export function formatActionLabel(action: string): string {
  return action.replaceAll("_", " ");
}

export function formatAuditDetails(details: Record<string, unknown> | null): string | null {
  if (!details) {
    return null;
  }

  const entries = Object.entries(details);

  if (entries.length === 0) {
    return null;
  }

  return entries.map(([key, value]) => `${key}: ${String(value ?? "-")}`).join(" | ");
}

export function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return "-";
  }

  if (userAgent.length <= 80) {
    return userAgent;
  }

  return `${userAgent.slice(0, 77)}...`;
}

export function useAdminPage() {
  const navigate = useNavigate();

  const [isLoadingRegistros, setIsLoadingRegistros] = useState(true);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSubmittingUsuario, setIsSubmittingUsuario] = useState(false);

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [latestClosedReports, setLatestClosedReports] = useState<RelatorioResumo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdminListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [novoUsuarioForm, setNovoUsuarioForm] = useState<NovoUsuarioForm>(initialNovoUsuarioForm);

  const auth = useMemo(() => getAuthSession(), []);

  const loadLogs = async (token: string) => {
    setIsLoadingLogs(true);

    try {
      const data = await listAuditLogs(token, 20);
      setAuditLogs(data);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getUserErrorMessage(error, "Não foi possível carregar os logs de auditoria."),
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      navigate("/");
      return;
    }

    if (auth.usuario.perfil !== "ADMIN") {
      navigate("/dashboard", {
        replace: true,
        state: { authMessage: "Você não tem permissão para acessar a área administrativa." },
      });
      return;
    }

    const authSession = auth;

    async function loadRegistros() {
      setIsLoadingRegistros(true);

      try {
        const closedResponse = await listRelatoriosFechados(authSession.token, {
          page: 1,
          pageSize: 5,
        });

        setLatestClosedReports(closedResponse.data);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Não foi possível carregar os registros."),
        });
      } finally {
        setIsLoadingRegistros(false);
      }
    }

    async function loadUsuarios() {
      setIsLoadingUsuarios(true);

      try {
        const data = await listUsuarios(authSession.token);
        setUsuarios(data);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Não foi possível carregar os usuários."),
        });
      } finally {
        setIsLoadingUsuarios(false);
      }
    }

    void loadRegistros();
    void loadUsuarios();
    void loadLogs(authSession.token);
  }, [auth, navigate]);

  const handleCreateUsuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;

    setIsSubmittingUsuario(true);
    setFeedback(null);

    try {
      const payload = {
        nome: novoUsuarioForm.nome.trim(),
        usuario: novoUsuarioForm.usuario.trim().toLowerCase(),
        senha: novoUsuarioForm.senha,
        turno: novoUsuarioForm.turno,
      };

      const created = await createUsuario(payload, authSession.token);
      setUsuarios((prev) => [created, ...prev]);
      setNovoUsuarioForm(initialNovoUsuarioForm);
      setFeedback({ type: "success", message: "Usuário criado com sucesso." });
      await loadLogs(authSession.token);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Não foi possível criar usuário.") });
    } finally {
      setIsSubmittingUsuario(false);
    }
  };

  const handleDeleteUsuario = async (usuarioId: number) => {
    if (!auth) {
      navigate("/");
      return;
    }

    const authSession = auth;
    const shouldDelete = window.confirm("Confirma inativar este operador? Ele não conseguirá mais logar.");

    if (!shouldDelete) {
      return;
    }

    setIsSubmittingUsuario(true);
    setFeedback(null);

    try {
      await deleteUsuario(usuarioId, authSession.token);
      setUsuarios((prev) => prev.map((item) => (item.id === usuarioId ? { ...item, ativo: false } : item)));
      setFeedback({ type: "success", message: "Usuário desativado com sucesso." });
      await loadLogs(authSession.token);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Não foi possível inativar usuário.") });
    } finally {
      setIsSubmittingUsuario(false);
    }
  };

  const handleRefreshLogs = async () => {
    if (!auth) {
      navigate("/");
      return;
    }

    await loadLogs(auth.token);
  };

  const handleGoRegistros = () => {
    navigate("/registros");
  };

  const handleOpenReport = (reportId: number) => {
    navigate(`/registros/${reportId}`);
  };

  return {
    auth,
    isLoadingRegistros,
    isLoadingUsuarios,
    isLoadingLogs,
    isSubmittingUsuario,
    feedback,
    latestClosedReports,
    usuarios,
    auditLogs,
    novoUsuarioForm,
    setNovoUsuarioForm,
    handleCreateUsuario,
    handleDeleteUsuario,
    handleRefreshLogs,
    handleGoRegistros,
    handleOpenReport,
  };
}
