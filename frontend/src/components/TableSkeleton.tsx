import Skeleton from "./Skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export default function TableSkeleton({ rows = 6, columns = 6, className = "" }: TableSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`table-skeleton-row-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={`table-skeleton-cell-${rowIndex}-${colIndex}`} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
