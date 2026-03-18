'use client';
import type { AdCreative } from '@/lib/ad-engine';

interface SidecarSponsorProps {
  creatives: AdCreative[];
}

/**
 * SidecarSponsor — desktop-only sidebar sponsor slot.
 * Max 1 per page. Shows in sidebar/aside. Always labeled.
 */
export function SidecarSponsor({ creatives }: SidecarSponsorProps) {
  if (creatives.length === 0) return null;
  const c = creatives[0]; // Sidecar shows top-ranked only

  return (
    <aside data-sponsor data-slot="sidecar_sponsor" className="sponsor-slot hidden lg:block bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">
          {c.sponsor_label}
        </span>
      </div>
      {c.image_square_url && (
        <img src={c.image_square_url} alt={c.headline} className="w-full aspect-square rounded-xl object-cover mb-3" />
      )}
      <h4 className="text-sm font-bold text-white mb-1">{c.headline}</h4>
      {c.subhead && <p className="text-xs text-gray-400 mb-3 line-clamp-3">{c.subhead}</p>}
      <div className="flex items-center gap-2 mb-3">
        {c.logo_url && <img src={c.logo_url} alt="" className="w-5 h-5 rounded object-contain" />}
        <span className="text-[10px] text-gray-500">{c.advertiser_name}</span>
      </div>
      <a href={c.cta_url} className="block w-full text-center bg-accent/10 text-accent text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-accent/20 transition-colors">
        {c.cta_label} →
      </a>
    </aside>
  );
}
