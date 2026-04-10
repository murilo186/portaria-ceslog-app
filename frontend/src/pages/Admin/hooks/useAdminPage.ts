import { getAuthSession } from "../../../services/authStorage";
import type { TurnoUsuario } from "../../../types/usuario";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Feedback } from "./adminPage.types";
import { useAdminData } from "./useAdminData";
import { useAdminUserActions } from "./useAdminUserActions";

export type { Feedback } from "./adminPage.types";

export function useAdminPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const auth = useMemo(() => getAuthSession(), []);

  const navigateToLogin = () => {
    navigate("/");
  };

  const navigateToDashboard = () => {
    navigate("/dashboard", {
      replace: true,
      state: { authMessage: "Voce nao tem permissao para acessar a area administrativa." },
    });
  };

  const {
    isLoadingRegistros,
    isLoadingUsuarios,
    isLoadingLogs,
    latestClosedReports,
    usuarios,
    setUsuarios,
    auditLogs,
    loadLogs,
  } = useAdminData({
    auth,
    navigateToLogin,
    navigateToDashboard,
    setFeedback,
  });

  const handleRefreshLogs = async () => {
    if (!auth) {
      navigateToLogin();
      return;
    }

    await loadLogs(auth.token, auth.usuario.id);
  };

  const { isSubmittingUsuario, novoUsuarioForm, setNovoUsuarioForm, handleCreateUsuario, handleDeleteUsuario } =
    useAdminUserActions({
      auth,
      navigateToLogin,
      setFeedback,
      setUsuarios,
      refreshLogs: handleRefreshLogs,
    });

  const handleGoRegistros = () => {
    navigate("/registros");
  };

  const handleOpenReport = (reportId: number) => {
    navigate(`/registros/${reportId}`);
  };

  const handleChangeNovoUsuarioNome = useCallback((value: string) => {
    setNovoUsuarioForm((prev) => ({ ...prev, nome: value }));
  }, [setNovoUsuarioForm]);

  const handleChangeNovoUsuarioLogin = useCallback((value: string) => {
    setNovoUsuarioForm((prev) => ({ ...prev, usuario: value }));
  }, [setNovoUsuarioForm]);

  const handleChangeNovoUsuarioSenha = useCallback((value: string) => {
    setNovoUsuarioForm((prev) => ({ ...prev, senha: value }));
  }, [setNovoUsuarioForm]);

  const handleChangeNovoUsuarioTurno = useCallback((turno: TurnoUsuario) => {
    setNovoUsuarioForm((prev) => ({ ...prev, turno }));
  }, [setNovoUsuarioForm]);

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
    handleChangeNovoUsuarioNome,
    handleChangeNovoUsuarioLogin,
    handleChangeNovoUsuarioSenha,
    handleChangeNovoUsuarioTurno,
    handleCreateUsuario,
    handleDeleteUsuario,
    handleRefreshLogs,
    handleGoRegistros,
    handleOpenReport,
  };
}
