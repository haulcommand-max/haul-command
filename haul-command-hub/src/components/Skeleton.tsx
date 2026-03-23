'use client';

/* ══════════════════════════════════════════════════════
   SKELETON LOADER — Global Loading State Component
   Premium shimmer effect for data-fetching components
   ══════════════════════════════════════════════════════ */

interface SkeletonProps {
  variant?: 'card' | 'table-row' | 'stat' | 'text' | 'map-marker';
  count?: number;
  className?: string;
}

function SkeletonPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03] bg-[length:200%_100%] rounded ${className}`}
      style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
    />
  );
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonPulse className="h-4 w-1/3" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonPulse className="h-3 w-2/3" />
          <div className="grid grid-cols-3 gap-3">
            <SkeletonPulse className="h-12 rounded-lg" />
            <SkeletonPulse className="h-12 rounded-lg" />
            <SkeletonPulse className="h-12 rounded-lg" />
          </div>
          <SkeletonPulse className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </>
  );
}

export function SkeletonTableRow({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
          <SkeletonPulse className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-3 w-1/2" />
            <SkeletonPulse className="h-2 w-1/3" />
          </div>
          <SkeletonPulse className="h-6 w-16 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </>
  );
}

export function SkeletonStat({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <SkeletonPulse className="h-2 w-1/2 mb-2" />
          <SkeletonPulse className="h-6 w-2/3 mb-1" />
          <SkeletonPulse className="h-2 w-1/3" />
        </div>
      ))}
    </>
  );
}

export function SkeletonText({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={`h-3 ${i === count - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export default function Skeleton({ variant = 'card', count = 1, className = '' }: SkeletonProps) {
  return (
    <div className={className}>
      {variant === 'card' && <SkeletonCard count={count} />}
      {variant === 'table-row' && <SkeletonTableRow count={count} />}
      {variant === 'stat' && <SkeletonStat count={count} />}
      {variant === 'text' && <SkeletonText count={count} />}
    </div>
  );
}
