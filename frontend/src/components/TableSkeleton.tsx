import { Box } from "@mui/material";
import Skeleton from "./Skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export default function TableSkeleton({ rows = 6, columns = 6, className = "" }: TableSkeletonProps) {
  return (
    <Box className={className} sx={{ display: "grid", gap: 1 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={`table-skeleton-row-${rowIndex}`}
          sx={{ display: "grid", gap: 1, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`table-skeleton-cell-${rowIndex}-${colIndex}`} className="h-4 w-full" />
          ))}
        </Box>
      ))}
    </Box>
  );
}
