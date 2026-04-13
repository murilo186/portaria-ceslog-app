type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-surface-200 ${className}`.trim()} />;
}
