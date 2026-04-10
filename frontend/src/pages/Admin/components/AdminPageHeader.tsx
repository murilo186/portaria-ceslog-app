import type { Feedback } from "../hooks/useAdminPage";

type AdminPageHeaderProps = {
  feedback: Feedback | null;
};

export default function AdminPageHeader({ feedback }: AdminPageHeaderProps) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-text-900">Administração</h1>
      <p className="text-sm text-text-700">Gerenciamento de usuários, logs de auditoria e registros.</p>
      {feedback ? (
        <p className={`text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-700"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}