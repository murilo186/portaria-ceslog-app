import FeedbackMessage from "../../../components/FeedbackMessage";
import type { Feedback } from "../hooks/useAdminPage";

type AdminPageHeaderProps = {
  feedback: Feedback | null;
};

export default function AdminPageHeader({ feedback }: AdminPageHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-text-900">Administracao</h1>
      <p className="text-sm text-text-700">Gerenciamento de usuarios, logs de auditoria e registros.</p>
      {feedback ? <FeedbackMessage message={feedback.message} tone={feedback.type} /> : null}
    </div>
  );
}