'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AdCreative } from '@/lib/ad-engine';

interface InlineBillboardProps {
  creatives: AdCreative[];
  rotationSeconds?: number;
  slotFamily?: string;
}

/**
 * InlineBillboard — mid-page contextual rotating sponsor surface.
 * Max 2 per page. Compact card format with rotation.
 */
export function InlineBillboard({ creatives, rotationSeconds = 10, slotFamily = 'inline_billboard' }: InlineBillboardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const rotate = useCallback(() => {
    if (creatives.length <= 1) return;
    setFade(false);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % creatives.length);
      setFade(true);
    }, 250);
  }, [creatives.length]);

  useEffect(() => {
    if (creatives.length <= 1) return;
    const timer = setInterval(rotate, rotationSeconds * 1000);
    return () => clearInterval(timer);
  }, [rotate, rotationSeconds, creatives.length]);

  if (creatives.length === 0) return null;
  const c = creatives[activeIndex];

  return (
    <div data-sponsor data-slot={slotFamily} className="sponsor-slot bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8 relative">
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">
          {c.sponsor_label}
        </span>
        <span className="text-xs text-gray-500">{c.advertiser_name}</span>
        {creatives.length > 1 && (
          <span className="text-[9px] text-gray-600 ml-auto">{activeIndex + 1}/{creatives.length}</span>
        )}
      </div>

      {/* Content */}
      <div className={`transition-opacity duration-250 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-start gap-4">
          {c.image_square_url && (
            <img src={c.image_square_url} alt={c.headline} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
          )}
          {!c.image_square_url && c.logo_url && (
            <img src={c.logo_url} alt={c.advertiser_name} className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white mb-1">{c.headline}</h4>
            {c.subhead && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{c.subhead}</p>}
            <a href={c.cta_url} className="inline-block bg-accent/10 text-accent text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-accent/20 transition-colors">
              {c.cta_label}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
