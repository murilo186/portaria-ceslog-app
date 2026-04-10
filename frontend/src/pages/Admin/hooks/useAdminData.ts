import { getUserErrorMessage } from "../../../services/errorService";
import { getCachedValue, setCachedValue } from "../../../services/requestCache";
import { listRelatoriosFechados } from "../../../services/relatorioService";
import { listAuditLogs, listUsuarios } from "../../../services/usuarioService";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AuthState } from "../../../types/auth";
import type { RelatorioResumo } from "../../../types/relatorio";
import type { AuditLogItem, UsuarioAdminListItem } from "../../../types/usuario";
import type { Feedback } from "./adminPage.types";
import {
  ADMIN_CACHE_TTL_MS,
  getAdminClosedReportsCacheKey,
  getAdminLogsCacheKey,
  getAdminUsersCacheKey,
} from "./adminCache";

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
    async (token: string, usuarioId: number) => {
      setIsLoadingLogs(true);

      const cacheKey = getAdminLogsCacheKey(usuarioId);
      const cached = getCachedValue<AuditLogItem[]>(cacheKey);

      if (cached) {
        setAuditLogs(cached);
        setIsLoadingLogs(false);
        return;
      }

      try {
        const data = await listAuditLogs(token, 20);
        setAuditLogs(data);
        setCachedValue(cacheKey, data, ADMIN_CACHE_TTL_MS);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Nao foi possivel carregar os logs de auditoria."),
        });
      } finally {
        setIsLoadingLogs(false);
      }
    },
    [setFeedback],
  );

  const loadRegistros = useCallback(
    async (token: string, usuarioId: number) => {
      setIsLoadingRegistros(true);

      const cacheKey = getAdminClosedReportsCacheKey(usuarioId);
      const cached = getCachedValue<RelatorioResumo[]>(cacheKey);

      if (cached) {
        setLatestClosedReports(cached);
        setIsLoadingRegistros(false);
        return;
      }

      try {
        const closedResponse = await listRelatoriosFechados(token, {
          page: 1,
          pageSize: 5,
        });

        setLatestClosedReports(closedResponse.data);
        setCachedValue(cacheKey, closedResponse.data, ADMIN_CACHE_TTL_MS);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Nao foi possivel carregar os registros."),
        });
      } finally {
        setIsLoadingRegistros(false);
      }
    },
    [setFeedback],
  );

  const loadUsuarios = useCallback(
    async (token: string, usuarioId: number) => {
      setIsLoadingUsuarios(true);

      const cacheKey = getAdminUsersCacheKey(usuarioId);
      const cached = getCachedValue<UsuarioAdminListItem[]>(cacheKey);

      if (cached) {
        setUsuarios(cached);
        setIsLoadingUsuarios(false);
        return;
      }

      try {
        const data = await listUsuarios(token);
        setUsuarios(data);
        setCachedValue(cacheKey, data, ADMIN_CACHE_TTL_MS);
      } catch (error) {
        setFeedback({
          type: "error",
          message: getUserErrorMessage(error, "Nao foi possivel carregar os usuarios."),
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

    const usuarioId = auth.usuario.id;

    void loadRegistros(auth.token, usuarioId);
    void loadUsuarios(auth.token, usuarioId);
    void loadLogs(auth.token, usuarioId);
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