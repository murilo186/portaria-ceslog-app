import { Skeleton as MuiSkeleton } from "@mui/material";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return <MuiSkeleton className={className} variant="rounded" animation="wave" />;
}
