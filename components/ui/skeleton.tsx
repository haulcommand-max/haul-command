import * as React from "react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Skeleton
// Premium shimmer loading states for the Command Black surface.
// Uses gold-tinted shimmer instead of generic gray bars.
// ══════════════════════════════════════════════════════════════

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl",
        "bg-hc-elevated",
        "bg-[length:200%_100%]",
        "bg-skeleton-shimmer",
        "animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

/** Pre-built skeleton patterns for common surfaces */
const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-hc-border-bare bg-hc-surface p-6 space-y-4", className)} {...props}>
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <div className="flex gap-3 pt-2">
      <Skeleton className="h-9 w-24 rounded-xl" />
      <Skeleton className="h-9 w-20 rounded-xl" />
    </div>
  </div>
);
SkeletonCard.displayName = "SkeletonCard";

const SkeletonRow = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center gap-4 py-3", className)} {...props}>
    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
  </div>
);
SkeletonRow.displayName = "SkeletonRow";

export { Skeleton, SkeletonCard, SkeletonRow };
