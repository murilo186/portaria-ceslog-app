import type { ReactNode } from "react";
import { Card as MuiCard, CardContent } from "@mui/material";

type CardProps = {
  children: ReactNode;
  className?: string;
  noRadius?: boolean;
  noShadow?: boolean;
  transparent?: boolean;
};

export default function Card({
  children,
  className = "",
  noRadius = false,
  noShadow = false,
  transparent = false,
}: CardProps) {
  return (
    <MuiCard
      className={className}
      sx={{
        borderRadius: noRadius ? 0 : 3,
        boxShadow: noShadow ? "none" : undefined,
        bgcolor: transparent ? "transparent" : undefined,
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, "&:last-child": { pb: { xs: 2.5, sm: 3, md: 3.5 } } }}>
        {children}
      </CardContent>
    </MuiCard>
  );
}
