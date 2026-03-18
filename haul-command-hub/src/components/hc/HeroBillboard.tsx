'use client';
import { useState, useEffect, useCallback } from 'react';
import type { AdCreative } from '@/lib/ad-engine';

interface RotatingBillboardProps {
  creatives: AdCreative[];
  rotationSeconds?: number;
  slotFamily: string;
  pageType: string;
}

/**
 * HeroBillboard — highest-intent top-of-page rotating sponsor surface.
 * Max 1 per page. Rotates creatives with crossfade.
 * Always labeled. Tracks impressions client-side.
 */
export function HeroBillboard({ creatives, rotationSeconds = 8, slotFamily, pageType }: RotatingBillboardProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const rotate = useCallback(() => {
    if (creatives.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % creatives.length);
      setIsTransitioning(false);
    }, 300);
  }, [creatives.length]);

  useEffect(() => {
    if (creatives.length <= 1) return;
    const timer = setInterval(rotate, rotationSeconds * 1000);
    return () => clearInterval(timer);
  }, [rotate, rotationSeconds, creatives.length]);

  if (creatives.length === 0) return null;
  const c = creatives[activeIndex];

  return (
    <div data-sponsor data-slot={slotFamily} className="sponsor-slot relative rounded-2xl overflow-hidden mb-8 border border-white/[0.06]">
      {/* Background */}
      <div className={`relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {c.image_landscape_url ? (
          <div className="relative h-48 md:h-64">
            <img src={c.image_landscape_url} alt={c.headline} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 flex items-center p-6 md:p-10">
              <div className="max-w-md">
                <h3 className="text-xl md:text-2xl font-black text-white mb-2">{c.headline}</h3>
                {c.subhead && <p className="text-sm text-gray-300 mb-4">{c.subhead}</p>}
                <a href={c.cta_url} className="inline-block bg-accent text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors">
                  {c.cta_label} →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-accent/[0.06] to-transparent p-6 md:p-10 flex items-center gap-6">
            {c.logo_url && <img src={c.logo_url} alt={c.advertiser_name} className="w-12 h-12 rounded-lg object-contain flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">{c.headline}</h3>
              {c.subhead && <p className="text-sm text-gray-400 mb-3">{c.subhead}</p>}
              <a href={c.cta_url} className="inline-block bg-accent text-black px-5 py-2 rounded-lg font-bold text-xs hover:bg-yellow-400 transition-colors">
                {c.cta_label} →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Label + dots */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-black/60 backdrop-blur px-2 py-0.5 rounded">
          {c.sponsor_label}
        </span>
      </div>
      {creatives.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {creatives.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsTransitioning(true); setTimeout(() => { setActiveIndex(i); setIsTransitioning(false); }, 300); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-accent w-4' : 'bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
