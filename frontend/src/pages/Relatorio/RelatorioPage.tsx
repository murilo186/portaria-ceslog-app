import { perfilPessoaLabel } from "../../utils/perfilPessoa";
import RelatorioCreateForm from "./components/RelatorioCreateForm";
import RelatorioDesktopTable from "./components/RelatorioDesktopTable";
import RelatorioEditModal from "./components/RelatorioEditModal";
import RelatorioHeader from "./components/RelatorioHeader";
import RelatorioMobileList from "./components/RelatorioMobileList";
import { useRelatorioPage } from "./hooks/useRelatorioPage";

export default function RelatorioPage() {
  const {
    showSimulationControls,
    isSubmitting,
    isLoading,
    isReadOnly,
    relatorioStatus,
    turnoAtual,
    usuarioNome,
    countdownMinutes,
    countdownSeconds,
    clockSimulationStart,
    feedback,
    formValues,
    setFormValues,
    handleCreateSubmit,
    handleCreateFormKeyDown,
    sortedItens,
    canManageItem,
    handleQuickSetSaida,
    handleOpenEditModal,
    handleDelete,
    getAutorLabelForItem,
    isEditModalOpen,
    editFormValues,
    setEditFormValues,
    handleCloseEditModal,
    handleEditSubmit,
    handleSimulateClockStart,
  } = useRelatorioPage();

  return (
    <>
      <div className="space-y-5 sm:space-y-6" aria-busy={isLoading || isSubmitting}>
        <RelatorioHeader
          showSimulationControls={showSimulationControls}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          isReadOnly={isReadOnly}
          onSimulateClockStart={handleSimulateClockStart}
          relatorioStatus={relatorioStatus}
          turnoAtual={turnoAtual}
          usuarioNome={usuarioNome}
          countdownMinutes={countdownMinutes}
          countdownSeconds={countdownSeconds}
          clockSimulationStart={clockSimulationStart}
          feedback={feedback}
        />

        <RelatorioCreateForm
          formValues={formValues}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          isLoading={isLoading}
          onSubmit={handleCreateSubmit}
          onKeyDown={handleCreateFormKeyDown}
          setFormValues={setFormValues}
        />

        <RelatorioMobileList
          isLoading={isLoading}
          items={sortedItens}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          canManageItem={canManageItem}
          onQuickSetSaida={handleQuickSetSaida}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          getAutorLabel={getAutorLabelForItem}
          perfilPessoaLabel={perfilPessoaLabel}
        />

        <RelatorioDesktopTable
          isLoading={isLoading}
          items={sortedItens}
          isReadOnly={isReadOnly}
          isSubmitting={isSubmitting}
          canManageItem={canManageItem}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          getAutorLabel={getAutorLabelForItem}
          perfilPessoaLabel={perfilPessoaLabel}
        />
      </div>

      <RelatorioEditModal
        isOpen={isEditModalOpen}
        isReadOnly={isReadOnly}
        isSubmitting={isSubmitting}
        values={editFormValues}
        setValues={setEditFormValues}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
      />
    </>
  );
}
