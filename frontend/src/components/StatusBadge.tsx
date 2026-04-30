import { Chip } from "@mui/material";

type StatusBadgeProps = {
  status: "ABERTO" | "FECHADO";
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 700,
        letterSpacing: "0.04em",
        borderWidth: 1,
        borderStyle: "solid",
        ...(status === "ABERTO"
          ? {
              borderColor: "#a7f3d0",
              bgcolor: "#ecfdf5",
              color: "#047857",
            }
          : {
              borderColor: "#e2e8f0",
              bgcolor: "#f1f5f9",
              color: "#475569",
            }),
      }}
    />
  );
}
