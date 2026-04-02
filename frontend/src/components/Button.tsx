import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const baseClassName =
  "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "border border-surface-200 bg-white text-text-900 hover:bg-surface-50",
};

export default function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClassName} ${variantClassName[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
