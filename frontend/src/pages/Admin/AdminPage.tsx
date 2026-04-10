import AdminAuditLogsCard from "./components/AdminAuditLogsCard";
import AdminClosedReportsCard from "./components/AdminClosedReportsCard";
import AdminPageHeader from "./components/AdminPageHeader";
import AdminRegistrosAccessCard from "./components/AdminRegistrosAccessCard";
import AdminUsuariosSection from "./components/AdminUsuariosSection";
import { useAdminPage } from "./hooks/useAdminPage";

export default function AdminPage() {
  const {
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
    handleChangeNovoUsuarioNome,
    handleChangeNovoUsuarioLogin,
    handleChangeNovoUsuarioSenha,
    handleChangeNovoUsuarioTurno,
    handleCreateUsuario,
    handleDeleteUsuario,
    handleRefreshLogs,
    handleGoRegistros,
    handleOpenReport,
  } = useAdminPage();

  return (
    <div className="space-y-6">
      <AdminPageHeader feedback={feedback} />

      <AdminRegistrosAccessCard onGoRegistros={handleGoRegistros} />

      <AdminUsuariosSection
        authUserId={auth?.usuario.id ?? null}
        isLoadingUsuarios={isLoadingUsuarios}
        isSubmittingUsuario={isSubmittingUsuario}
        usuarios={usuarios}
        novoUsuarioForm={novoUsuarioForm}
        onChangeNome={handleChangeNovoUsuarioNome}
        onChangeUsuario={handleChangeNovoUsuarioLogin}
        onChangeSenha={handleChangeNovoUsuarioSenha}
        onChangeTurno={handleChangeNovoUsuarioTurno}
        onCreateUsuario={handleCreateUsuario}
        onDeleteUsuario={handleDeleteUsuario}
      />

      <AdminAuditLogsCard isLoadingLogs={isLoadingLogs} logs={auditLogs} onRefreshLogs={handleRefreshLogs} />

      <AdminClosedReportsCard
        isLoadingRegistros={isLoadingRegistros}
        reports={latestClosedReports}
        onOpenReport={handleOpenReport}
      />
    </div>
  );
}
