import type { ButtonHTMLAttributes } from "react";
import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";

type IconAction = "edit" | "delete";

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color">;

type IconActionButtonProps = NativeButtonProps & {
  action: IconAction;
  label: string;
};

function PencilIcon() {
  return <EditOutlined fontSize="small" />;
}

function TrashIcon() {
  return <DeleteOutlined fontSize="small" />;
}

export default function IconActionButton({
  action,
  className = "",
  label,
  type = "button",
  ...props
}: IconActionButtonProps) {
  return (
    <IconButton
      component="button"
      type={type}
      aria-label={label}
      title={label}
      className={className}
      color={action === "delete" ? "error" : "default"}
      sx={{
        border: "1px solid",
        borderColor: action === "delete" ? "#fecaca" : "#e5e7eb",
        borderRadius: 0,
      }}
      {...props}
    >
      {action === "edit" ? <PencilIcon /> : <TrashIcon />}
    </IconButton>
  );
}
