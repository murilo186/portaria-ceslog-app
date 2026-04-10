import { getUserErrorMessage } from "../../../services/errorService";
import { clearCacheByPrefix } from "../../../services/requestCache";
import { createUsuario, deleteUsuario } from "../../../services/usuarioService";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { AuthState } from "../../../types/auth";
import type { UsuarioAdminListItem } from "../../../types/usuario";
import type { Feedback, NovoUsuarioForm } from "./adminPage.types";
import { initialNovoUsuarioForm } from "./adminPage.types";

type UseAdminUserActionsParams = {
  auth: AuthState | null;
  navigateToLogin: () => void;
  setFeedback: Dispatch<SetStateAction<Feedback | null>>;
  setUsuarios: Dispatch<SetStateAction<UsuarioAdminListItem[]>>;
  refreshLogs: () => Promise<void>;
};

export function useAdminUserActions({
  auth,
  navigateToLogin,
  setFeedback,
  setUsuarios,
  refreshLogs,
}: UseAdminUserActionsParams) {
  const [isSubmittingUsuario, setIsSubmittingUsuario] = useState(false);
  const [novoUsuarioForm, setNovoUsuarioForm] = useState<NovoUsuarioForm>(initialNovoUsuarioForm);

  const invalidateAdminCache = () => {
    clearCacheByPrefix("admin:users:");
    clearCacheByPrefix("admin:logs:");
  };

  const handleCreateUsuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      navigateToLogin();
      return;
    }

    setIsSubmittingUsuario(true);
    setFeedback(null);

    try {
      const payload = {
        nome: novoUsuarioForm.nome.trim(),
        usuario: novoUsuarioForm.usuario.trim().toLowerCase(),
        senha: novoUsuarioForm.senha,
        turno: novoUsuarioForm.turno,
      };

      const created = await createUsuario(payload, auth.token);
      setUsuarios((prev) => [created, ...prev]);
      setNovoUsuarioForm(initialNovoUsuarioForm);
      invalidateAdminCache();
      setFeedback({ type: "success", message: "Usuario criado com sucesso." });
      await refreshLogs();
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel criar usuario.") });
    } finally {
      setIsSubmittingUsuario(false);
    }
  };

  const handleDeleteUsuario = async (usuarioId: number) => {
    if (!auth) {
      navigateToLogin();
      return;
    }

    const shouldDelete = window.confirm("Confirma inativar este operador? Ele nao conseguira mais logar.");

    if (!shouldDelete) {
      return;
    }

    setIsSubmittingUsuario(true);
    setFeedback(null);

    try {
      await deleteUsuario(usuarioId, auth.token);
      setUsuarios((prev) => prev.map((item) => (item.id === usuarioId ? { ...item, ativo: false } : item)));
      invalidateAdminCache();
      setFeedback({ type: "success", message: "Usuario desativado com sucesso." });
      await refreshLogs();
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel inativar usuario.") });
    } finally {
      setIsSubmittingUsuario(false);
    }
  };

  return {
    isSubmittingUsuario,
    novoUsuarioForm,
    setNovoUsuarioForm,
    handleCreateUsuario,
    handleDeleteUsuario,
  };
}