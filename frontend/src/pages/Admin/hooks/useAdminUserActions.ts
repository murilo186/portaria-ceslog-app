import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { createUsuario, deleteUsuario } from "../../../services/usuarioService";
import type { AuthState } from "../../../types/auth";
import type { UsuarioAdminListItem } from "../../../types/usuario";
import type { Feedback, NovoUsuarioForm } from "./adminPage.types";
import { initialNovoUsuarioForm } from "./adminPage.types";

type UseAdminUserActionsParams = {
  auth: AuthState | null;
  navigateToLogin: () => void;
  setFeedback: Dispatch<SetStateAction<Feedback | null>>;
};

const AUDIT_LOG_LIMIT = 20;

export function useAdminUserActions({ auth, navigateToLogin, setFeedback }: UseAdminUserActionsParams) {
  const queryClient = useQueryClient();
  const [novoUsuarioForm, setNovoUsuarioForm] = useState<NovoUsuarioForm>(initialNovoUsuarioForm);

  const createUsuarioMutation = useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: { nome: string; usuario: string; senha: string; turno: "MANHA" | "TARDE" } }) =>
      createUsuario(payload, token),
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: ({ token, usuarioId }: { token: string; usuarioId: number }) => deleteUsuario(usuarioId, token),
  });

  const invalidateAdminQueries = async (adminUserId: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers(adminUserId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLogs(adminUserId, AUDIT_LOG_LIMIT) }),
    ]);
  };

  const handleCreateUsuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      navigateToLogin();
      return;
    }

    setFeedback(null);

    try {
      const payload = {
        nome: novoUsuarioForm.nome.trim(),
        usuario: novoUsuarioForm.usuario.trim().toLowerCase(),
        senha: novoUsuarioForm.senha,
        turno: novoUsuarioForm.turno,
      };

      const created = await createUsuarioMutation.mutateAsync({
        token: auth.token,
        payload,
      });

      queryClient.setQueryData<UsuarioAdminListItem[]>(queryKeys.adminUsers(auth.usuario.id), (previous) => {
        if (!previous) {
          return [created];
        }

        return [created, ...previous];
      });

      setNovoUsuarioForm(initialNovoUsuarioForm);
      setFeedback({ type: "success", message: "Usuario criado com sucesso." });
      await invalidateAdminQueries(auth.usuario.id);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel criar usuario.") });
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

    setFeedback(null);

    try {
      await deleteUsuarioMutation.mutateAsync({ token: auth.token, usuarioId });

      queryClient.setQueryData<UsuarioAdminListItem[]>(queryKeys.adminUsers(auth.usuario.id), (previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((item) => (item.id === usuarioId ? { ...item, ativo: false } : item));
      });

      setFeedback({ type: "success", message: "Usuario desativado com sucesso." });
      await invalidateAdminQueries(auth.usuario.id);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Nao foi possivel inativar usuario.") });
    }
  };

  return {
    isSubmittingUsuario: createUsuarioMutation.isPending || deleteUsuarioMutation.isPending,
    novoUsuarioForm,
    setNovoUsuarioForm,
    handleCreateUsuario,
    handleDeleteUsuario,
  };
}
