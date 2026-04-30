import type { ButtonHTMLAttributes } from "react";
import { Button as MuiButton } from "@mui/material";

type ButtonVariant = "primary" | "secondary";

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">;

type ButtonProps = NativeButtonProps & {
  variant?: ButtonVariant;
};

export default function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <MuiButton
      type={type}
      className={className}
      variant={variant === "primary" ? "contained" : "outlined"}
      sx={{
        borderRadius: 2,
        px: 2,
        py: 1.25,
        fontSize: "0.875rem",
        boxShadow: "none",
        ...(variant === "secondary"
          ? {
              borderColor: "#e5e7eb",
              color: "#111827",
              backgroundColor: "#fff",
            }
          : {}),
      }}
      {...props}
    >
      {children}
    </MuiButton>
  );
}
