import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { createUsuario, updateUsuarioAtivo } from "../../../services/usuarioService";
import type { AuthState } from "../../../types/auth";
import type { UsuarioAdminListItem } from "../../../types/usuario";
import type { Feedback, NovoUsuarioForm } from "./adminPage.types";
import { initialNovoUsuarioForm } from "./adminPage.types";

type UseAdminUserActionsParams = {
  auth: AuthState | null;
  navigateToLogin: () => void;
  setFeedback: Dispatch<SetStateAction<Feedback | null>>;
};

const AUDIT_LOG_LIMIT = 100;

export function useAdminUserActions({ auth, navigateToLogin, setFeedback }: UseAdminUserActionsParams) {
  const queryClient = useQueryClient();
  const [novoUsuarioForm, setNovoUsuarioForm] = useState<NovoUsuarioForm>(initialNovoUsuarioForm);
  const [pendingUsuarioId, setPendingUsuarioId] = useState<number | null>(null);

  const createUsuarioMutation = useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: { nome: string; usuario: string; senha: string; turno: "MANHA" | "TARDE" } }) =>
      createUsuario(payload, token),
  });

  const updateUsuarioAtivoMutation = useMutation({
    mutationFn: ({ token, usuarioId, ativo }: { token: string; usuarioId: number; ativo: boolean }) =>
      updateUsuarioAtivo(usuarioId, ativo, token),
  });

  const invalidateAdminQueries = async (tenantId: number, adminUserId: number) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers(tenantId, adminUserId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminLogs(tenantId, adminUserId, AUDIT_LOG_LIMIT) }),
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

      queryClient.setQueryData<UsuarioAdminListItem[]>(
        queryKeys.adminUsers(auth.usuario.tenant.id, auth.usuario.id),
        (previous) => {
        if (!previous) {
          return [created];
        }

        return [created, ...previous];
      });

      setNovoUsuarioForm(initialNovoUsuarioForm);
      setFeedback({ type: "success", message: "Usuário criado com sucesso." });
      await invalidateAdminQueries(auth.usuario.tenant.id, auth.usuario.id);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Não foi possível criar usuário.") });
    }
  };

  const handleToggleUsuarioAtivo = async (usuarioId: number, ativoAtual: boolean) => {
    if (!auth) {
      navigateToLogin();
      return;
    }

    setFeedback(null);
    setPendingUsuarioId(usuarioId);

    try {
      await updateUsuarioAtivoMutation.mutateAsync({ token: auth.token, usuarioId, ativo: !ativoAtual });

      queryClient.setQueryData<UsuarioAdminListItem[]>(
        queryKeys.adminUsers(auth.usuario.tenant.id, auth.usuario.id),
        (previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((item) => (item.id === usuarioId ? { ...item, ativo: !ativoAtual } : item));
      });

      setFeedback({
        type: "success",
        message: ativoAtual ? "Usuário inativado com sucesso." : "Usuário ativado com sucesso.",
      });
      await invalidateAdminQueries(auth.usuario.tenant.id, auth.usuario.id);
    } catch (error) {
      setFeedback({ type: "error", message: getUserErrorMessage(error, "Não foi possível atualizar status do usuário.") });
    } finally {
      setPendingUsuarioId(null);
    }
  };

  return {
    isSubmittingUsuario: createUsuarioMutation.isPending || updateUsuarioAtivoMutation.isPending,
    isCreatingUsuario: createUsuarioMutation.isPending,
    isUpdatingUsuarioAtivo: updateUsuarioAtivoMutation.isPending,
    pendingUsuarioId,
    novoUsuarioForm,
    setNovoUsuarioForm,
    handleCreateUsuario,
    handleToggleUsuarioAtivo,
  };
}
