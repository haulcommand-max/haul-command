'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AdCreative } from '@/lib/ad-engine';

interface SidecarSponsorProps {
  creatives: AdCreative[];
  rotationSeconds?: number;
}

/**
 * SidecarSponsor — desktop-only sidebar sponsor slot.
 * Max 1 per page. Shows in sidebar/aside. Always labeled.
 */
export function SidecarSponsor({ creatives, rotationSeconds = 8 }: SidecarSponsorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const rotate = useCallback(() => {
    if (creatives.length <= 1) return;
    setFade(false);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % creatives.length);
      setFade(true);
    }, 300); // Fade duration
  }, [creatives.length]);

  useEffect(() => {
    if (creatives.length <= 1) return;
    const timer = setInterval(rotate, rotationSeconds * 1000);
    return () => clearInterval(timer);
  }, [rotate, rotationSeconds, creatives.length]);

  if (creatives.length === 0) return null;
  const c = creatives[activeIndex];

  return (
    <aside data-sponsor data-slot="sidecar_sponsor" className="sponsor-slot hidden lg:block bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/10 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-white/50 bg-black/50 uppercase tracking-widest border border-white/10 rounded px-2 py-0.5 shadow-inner flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-hc-gold animate-pulse" />
          {c.sponsor_label || 'Sponsored Premium'}
        </span>
        {creatives.length > 1 && (
          <div className="flex gap-1.5 items-center">
             {creatives.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIndex ? 'bg-hc-gold scale-125' : 'bg-white/20'}`} />
             ))}
          </div>
        )}
      </div>

      <div className={`transition-opacity duration-300 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
        {c.image_square_url && (
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 shadow-xl border border-white/5 group">
             <img src={c.image_square_url} alt={c.headline} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
             <div className="absolute bottom-3 left-3 flex items-center gap-2">
                {c.logo_url && <img src={c.logo_url} alt="" className="w-6 h-6 rounded bg-black/50 p-0.5 object-contain border border-white/10" />}
                <span className="text-xs font-bold text-white shadow-black drop-shadow-md">{c.advertiser_name}</span>
             </div>
          </div>
        )}

        <h4 className="text-base font-black text-white mb-2 leading-tight pr-4">{c.headline}</h4>
        {c.subhead && <p className="text-xs text-gray-400 mb-5 line-clamp-3 leading-relaxed">{c.subhead}</p>}
        
        <a href={c.cta_url} className="flex justify-center items-center w-full bg-accent/15 text-accent text-xs font-black uppercase tracking-wider px-4 py-3 rounded-xl hover:bg-accent hover:text-black transition-all duration-300 group ring-1 ring-accent/20">
          {c.cta_label} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>
    </aside>
  );
}
