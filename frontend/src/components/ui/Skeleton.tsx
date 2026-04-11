import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-border-soft", className)} />;
}

export function SkeletonCard({ lines = 3 }: Props) {
  return (
    <div className="bg-surface rounded-2xl border border-border-soft p-5 flex flex-col gap-3">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-3.5 w-full" />
      ))}
    </div>
  );
}
