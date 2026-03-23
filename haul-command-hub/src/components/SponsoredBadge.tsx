'use client';

/* ══════════════════════════════════════════════════════
   SPONSORED BADGE — AdGrid Load Board Highlight
   Visually highlights boosted loads with premium styling 
   ══════════════════════════════════════════════════════ */

interface SponsoredBadgeProps {
  tierName?: string;
  className?: string;
}

export default function SponsoredBadge({ tierName = 'Sponsored', className = '' }: SponsoredBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-400 border border-amber-500/30 ag-sponsored-glow ${className}`}>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
        <path d="M8 0l2.5 5.3L16 6.2l-4 3.8 1 5.5L8 12.7l-5 2.8 1-5.5-4-3.8 5.5-.9z" />
      </svg>
      {tierName}
    </span>
  );
}

/* ══════════════════════════════════════════════════════
   SPONSORED CARD WRAPPER — Wraps a load board item
   Adds gold border glow and "Sponsored" badge
   ══════════════════════════════════════════════════════ */

interface SponsoredCardProps {
  children: React.ReactNode;
  tierName?: string;
  className?: string;
}

export function SponsoredCard({ children, tierName = 'Sponsored', className = '' }: SponsoredCardProps) {
  return (
    <div className={`relative ag-sponsored-glow border-amber-500/30 rounded-2xl ${className}`}>
      <div className="absolute top-3 right-3 z-10">
        <SponsoredBadge tierName={tierName} />
      </div>
      {children}
    </div>
  );
}
