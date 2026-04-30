import { Box, Paper } from "@mui/material";
import Skeleton from "./Skeleton";

type ListSkeletonProps = {
  rows?: number;
  className?: string;
};

export default function ListSkeleton({ rows = 5, className = "" }: ListSkeletonProps) {
  return (
    <Box className={className} sx={{ display: "grid", gap: 1 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <Paper key={`skeleton-row-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Skeleton className="mb-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </Paper>
      ))}
    </Box>
  );
}
