import type { ReactNode } from "react";
import { Card as MuiCard, CardContent } from "@mui/material";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <MuiCard className={className} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 3.5 }, "&:last-child": { pb: { xs: 2.5, sm: 3, md: 3.5 } } }}>
        {children}
      </CardContent>
    </MuiCard>
  );
}
