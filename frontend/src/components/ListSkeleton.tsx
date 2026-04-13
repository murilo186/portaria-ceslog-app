import Skeleton from "./Skeleton";

type ListSkeletonProps = {
  rows?: number;
  className?: string;
};

export default function ListSkeleton({ rows = 5, className = "" }: ListSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`skeleton-row-${index}`} className="rounded-md border border-surface-200 p-3">
          <Skeleton className="mb-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
