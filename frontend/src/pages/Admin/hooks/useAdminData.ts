import { getUserErrorMessage } from "../../../services/errorService";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { listAuditLogs, listUsuarios } from "../../../services/usuarioService";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
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

export function useAdminData({ auth, navigateToLogin, navigateToDashboard, setFeedback }: UseAdminDataParams) {
  const [isLoadingRegistros, setIsLoadingRegistros] = useState(true);
  const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [latestClosedReports, setLatestClosedReports] = useState<RelatorioResumo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdminListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const loadLogs = useCallback(
    async (token: string) => {
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
    },
    [setFeedback],
  );

  const loadRegistros = useCallback(
    async (token: string) => {
      setIsLoadingRegistros(true);

      try {
        const closedResponse = await listRelatoriosFechados(token, {
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
    },
    [setFeedback],
  );

  const loadUsuarios = useCallback(
    async (token: string) => {
      setIsLoadingUsuarios(true);

      try {
        const data = await listUsuarios(token);
        setUsuarios(data);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Não foi possível carregar os usuários."),
        });
      } finally {
        setIsLoadingUsuarios(false);
      }
    },
    [setFeedback],
  );

  useEffect(() => {
    if (!auth) {
      navigateToLogin();
      return;
    }

    if (auth.usuario.perfil !== "ADMIN") {
      navigateToDashboard();
      return;
    }

    void loadRegistros(auth.token);
    void loadUsuarios(auth.token);
    void loadLogs(auth.token);
  }, [auth, loadLogs, loadRegistros, loadUsuarios, navigateToDashboard, navigateToLogin]);

  return {
    isLoadingRegistros,
    isLoadingUsuarios,
    isLoadingLogs,
    latestClosedReports,
    usuarios,
    setUsuarios,
    auditLogs,
    loadLogs,
  };
}