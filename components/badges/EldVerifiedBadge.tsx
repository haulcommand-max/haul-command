'use client';

export function EldVerifiedBadge({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { badge: 'px-1.5 py-0.5 text-[10px] gap-1', icon: 'w-3 h-3' },
    md: { badge: 'px-2 py-1 text-xs gap-1.5', icon: 'w-3.5 h-3.5' },
    lg: { badge: 'px-3 py-1.5 text-sm gap-2', icon: 'w-4 h-4' },
  };
  const s = sizes[size];

  return (
    <span className={`inline-flex items-center ${s.badge} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold whitespace-nowrap`}>
      <svg className={s.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      ELD Verified
    </span>
  );
}
