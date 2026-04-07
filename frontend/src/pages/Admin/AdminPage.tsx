import { getAuthSession } from "../../services/authStorage";
import { getUserErrorMessage } from "../../services/errorService";
import { listRelatoriosFechados } from "../../services/relatorioService";
import { createUsuario, deleteUsuario, listAuditLogs, listUsuarios } from "../../services/usuarioService";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Input from "../../components/Input";
import type { RelatorioResumo } from "../../types/relatorio";
import type { AuditLogItem, TurnoUsuario, UsuarioAdminListItem } from "../../types/usuario";

type Feedback = {
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

function formatDate(dateIso: string): string {
  const iso = dateIso.slice(0, 10);
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(dateIso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(dateIso));
}

function formatActionLabel(action: string): string {
  return action.replaceAll("_", " ");
}

function formatAuditDetails(details: Record<string, unknown> | null): string | null {
  if (!details) {
    return null;
  }

  const entries = Object.entries(details);

  if (entries.length === 0) {
    return null;
  }

  return entries.map(([key, value]) => `${key}: ${String(value ?? "-")}`).join(" | ");
}

function formatUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return "-";
  }

  if (userAgent.length <= 80) {
    return userAgent;
  }

  return `${userAgent.slice(0, 77)}...`;
}

export default function AdminPage() {
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
        message: getUserErrorMessage(error, "Nao foi possivel carregar os logs de auditoria."),
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
        state: { authMessage: "Voce nao tem permissao para acessar a area administrativa." },
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
          message: getUserErrorMessage(error, "Nao foi possivel carregar os registros."),
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
          message: getUserErrorMessage(error, "Nao foi possivel carregar os usuarios."),
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
      setFeedback({ type: "success", message: "Usuario criado com sucesso." });
      await loadLogs(authSession.token);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel criar usuario.") });
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
    const shouldDelete = window.confirm("Confirma inativar este operador? Ele nao conseguira mais logar.");

    if (!shouldDelete) {
      return;
    }

    setIsSubmittingUsuario(true);
    setFeedback(null);

    try {
      await deleteUsuario(usuarioId, authSession.token);
      setUsuarios((prev) => prev.map((item) => (item.id === usuarioId ? { ...item, ativo: false } : item)));
      setFeedback({ type: "success", message: "Usuario desativado com sucesso." });
      await loadLogs(authSession.token);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel inativar usuario.") });
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-text-900">Administracao</h1>
        <p className="text-sm text-text-700">Gerenciamento de usuarios, logs de auditoria e registros.</p>
        {feedback ? (
          <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
            {feedback.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-text-900">Lista de registros</h2>
          <p className="text-sm text-text-700">Acesse o historico completo de relatorios fechados.</p>
          <Button type="button" variant="secondary" onClick={() => navigate("/registros")}>Abrir registros</Button>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-4 xl:col-span-1">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-text-900">Criar usuario</h2>
            <p className="text-sm text-text-700">Campos obrigatorios: nome, usuario, senha e turno.</p>
          </div>

          <form className="space-y-3" onSubmit={handleCreateUsuario}>
            <Input
              id="novo-nome"
              label="Nome"
              value={novoUsuarioForm.nome}
              onChange={(event) => setNovoUsuarioForm((prev) => ({ ...prev, nome: event.target.value }))}
              placeholder="Nome completo"
              required
            />

            <Input
              id="novo-usuario"
              label="Usuario"
              value={novoUsuarioForm.usuario}
              onChange={(event) => setNovoUsuarioForm((prev) => ({ ...prev, usuario: event.target.value }))}
              placeholder="usuario.exemplo"
              required
            />

            <Input
              id="nova-senha"
              label="Senha"
              type="password"
              value={novoUsuarioForm.senha}
              onChange={(event) => setNovoUsuarioForm((prev) => ({ ...prev, senha: event.target.value }))}
              placeholder="Minimo 6 caracteres"
              required
            />

            <div className="flex w-full flex-col gap-1.5">
              <label htmlFor="novo-turno" className="text-sm font-medium text-text-700">
                Turno
              </label>
              <select
                id="novo-turno"
                value={novoUsuarioForm.turno}
                onChange={(event) =>
                  setNovoUsuarioForm((prev) => ({ ...prev, turno: event.target.value as TurnoUsuario }))
                }
                className="w-full rounded-md border border-surface-200 bg-white px-3 py-2.5 text-sm text-text-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="MANHA">MANHA</option>
                <option value="TARDE">TARDE</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmittingUsuario || isLoadingUsuarios}>
              {isSubmittingUsuario ? "Salvando..." : "Criar usuario"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-3 xl:col-span-2">
          <h2 className="text-lg font-semibold text-text-900">Lista de usuarios</h2>

          {isLoadingUsuarios ? (
            <p className="text-sm text-text-700">Carregando...</p>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-text-700">Nenhum usuario encontrado.</p>
          ) : (
            <div className="space-y-2">
              {usuarios.map((item) => {
                const isCurrentUser = auth?.usuario.id === item.id;
                const isOperador = item.perfil === "OPERADOR";
                const canDelete = item.ativo && isOperador && !isCurrentUser;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-md border border-surface-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-900">{item.nome}</p>
                      <p className="text-xs text-text-700">Usuario: {item.usuario ?? "-"}</p>
                      <p className="text-xs text-text-700">Turno: {item.turno ?? "-"}</p>
                      <p className="text-xs text-text-700">Perfil: {item.perfil}</p>
                      <p className="text-xs text-text-700">Status: {item.ativo ? "ATIVO" : "INATIVO"}</p>
                    </div>

                    {item.perfil === "ADMIN" ? null : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => void handleDeleteUsuario(item.id)}
                        disabled={!canDelete || isSubmittingUsuario}
                      >
                        {item.ativo ? "Inativar" : "Inativo"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-text-900">Logs de auditoria</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-700">Mostrando ultimos {auditLogs.length} eventos</span>
            <Button type="button" variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => void handleRefreshLogs()} disabled={isLoadingLogs}>
              Atualizar logs
            </Button>
          </div>
        </div>

        {isLoadingLogs ? (
          <p className="text-sm text-text-700">Carregando lista...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-sm text-text-700">Ainda nao ha eventos registrados.</p>
        ) : (
          <div className="divide-y divide-surface-200 rounded-md border border-surface-200">
            {auditLogs.map((log) => (
              <div key={log.id} className="space-y-1 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text-900">{formatActionLabel(log.acao)}</p>
                  <p className="text-xs text-text-700">{formatDateTime(log.criadoEm)}</p>
                </div>
                <p className="text-sm text-text-700">{log.descricao}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-700">
                  <span>Autor: {log.usuario?.nome ?? log.usuarioNome ?? "-"}</span>
                  <span>Login: {log.usuario?.usuario ?? log.usuarioLogin ?? "-"}</span>
                  <span>
                    Alvo: {log.entidade}
                    {log.entidadeId ? ` #${log.entidadeId}` : ""}
                  </span>
                  <span>IP: {log.ip ?? "-"}</span>
                  <span>Request ID: {log.requestId ?? "-"}</span>
                  <span>User-Agent: {formatUserAgent(log.userAgent)}</span>
                </div>
                {formatAuditDetails(log.detalhes) ? (
                  <p className="text-xs text-text-700">Detalhes: {formatAuditDetails(log.detalhes)}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-text-900">Ultimos registros fechados</h2>

        {isLoadingRegistros ? (
          <p className="text-sm text-text-700">Carregando lista...</p>
        ) : latestClosedReports.length === 0 ? (
          <p className="text-sm text-text-700">Ainda nao ha relatorios fechados.</p>
        ) : (
          <div className="divide-y divide-surface-200 rounded-md border border-surface-200">
            {latestClosedReports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => navigate(`/registros/${report.id}`)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-50"
              >
                <span className="text-sm font-medium text-text-900">REGISTRO - {formatDate(report.dataRelatorio)}</span>
                <span className="text-xs text-text-700">Itens: {report._count?.itens ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
