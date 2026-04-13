import { useQuery } from "@tanstack/react-query";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { getUserErrorMessage } from "../../../services/errorService";
import { queryKeys } from "../../../services/queryKeys";
import { listAuditLogs, listUsuarios } from "../../../services/usuarioService";
import type { AuthState } from "../../../types/auth";
import type { RelatorioResumo } from "../../../types/relatorio";
import type { AuditLogItem, UsuarioAdminListItem } from "../../../types/usuario";
import type { Feedback } from "./adminPage.types";

type UseAdminDataParams = {
  auth: AuthState | null;
  navigateToLogin: () => void;
  navigateToDashboard: () => void;
  setFeedback: Dispatch<SetStateAction<Feedback | null>>;
};

const AUDIT_LOG_LIMIT = 100;
const ADMIN_CLOSED_REPORTS_PAGE_SIZE = 5;

export function useAdminData({ auth, navigateToLogin, navigateToDashboard, setFeedback }: UseAdminDataParams) {
  const usuarioId = auth?.usuario.id ?? null;
  const token = auth?.token ?? null;
  const isAdmin = auth?.usuario.perfil === "ADMIN";
  const isEnabled = Boolean(token && usuarioId && isAdmin);

  useEffect(() => {
    if (!auth) {
      navigateToLogin();
      return;
    }

    if (!isAdmin) {
      navigateToDashboard();
    }
  }, [auth, isAdmin, navigateToDashboard, navigateToLogin]);

  const closedReportsQuery = useQuery<RelatorioResumo[]>({
    queryKey: queryKeys.adminClosedReports(usuarioId ?? 0, ADMIN_CLOSED_REPORTS_PAGE_SIZE),
    enabled: isEnabled,
    queryFn: async () => {
      const response = await listRelatoriosFechados(token!, {
        page: 1,
        pageSize: ADMIN_CLOSED_REPORTS_PAGE_SIZE,
      });

      return response.data;
    },
    staleTime: 30_000,
  });

  const usersQuery = useQuery<UsuarioAdminListItem[]>({
    queryKey: queryKeys.adminUsers(usuarioId ?? 0),
    enabled: isEnabled,
    queryFn: () => listUsuarios(token!),
    staleTime: 30_000,
  });

  const logsQuery = useQuery<AuditLogItem[]>({
    queryKey: queryKeys.adminLogs(usuarioId ?? 0, AUDIT_LOG_LIMIT),
    enabled: isEnabled,
    queryFn: () => listAuditLogs(token!, AUDIT_LOG_LIMIT),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!closedReportsQuery.error) {
      return;
    }

    setFeedback({
      type: "error",
      message: getUserErrorMessage(closedReportsQuery.error, "Nao foi possivel carregar os registros."),
    });
  }, [closedReportsQuery.error, setFeedback]);

  useEffect(() => {
    if (!usersQuery.error) {
      return;
    }

    setFeedback({
      type: "error",
      message: getUserErrorMessage(usersQuery.error, "Nao foi possivel carregar os usuarios."),
    });
  }, [setFeedback, usersQuery.error]);

  useEffect(() => {
    if (!logsQuery.error) {
      return;
    }

    setFeedback({
      type: "error",
      message: getUserErrorMessage(logsQuery.error, "Nao foi possivel carregar os logs de auditoria."),
    });
  }, [logsQuery.error, setFeedback]);

  return {
    isLoadingRegistros: closedReportsQuery.isLoading,
    isLoadingUsuarios: usersQuery.isLoading,
    isLoadingLogs: logsQuery.isLoading,
    latestClosedReports: closedReportsQuery.data ?? [],
    usuarios: usersQuery.data ?? [],
    auditLogs: logsQuery.data ?? [],
    refetchLogs: logsQuery.refetch,
  };
}
