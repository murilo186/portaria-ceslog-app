type StatusBadgeProps = {
  status: "ABERTO" | "FECHADO";
};

const badgeClassByStatus: Record<StatusBadgeProps["status"], string> = {
  ABERTO: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FECHADO: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${badgeClassByStatus[status]}`}
    >
      {status}
    </span>
  );
}

