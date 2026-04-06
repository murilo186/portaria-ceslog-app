import type { ButtonHTMLAttributes } from "react";

type IconAction = "edit" | "delete";

type IconActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  action: IconAction;
  label: string;
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

const baseClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const classByAction: Record<IconAction, string> = {
  edit: "border-surface-200 bg-white text-text-900 hover:bg-surface-50 focus-visible:ring-brand-500/30",
  delete: "border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-500/30",
};

export default function IconActionButton({
  action,
  className = "",
  label,
  type = "button",
  ...props
}: IconActionButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`${baseClassName} ${classByAction[action]} ${className}`.trim()}
      {...props}
    >
      {action === "edit" ? <PencilIcon /> : <TrashIcon />}
    </button>
  );
}
