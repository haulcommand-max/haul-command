'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { AdCreative } from '@/lib/ad-engine';

interface StickyMobileChipRailProps {
  creatives: AdCreative[];
  rotationSeconds?: number;
}

/**
 * StickyMobileChipRail — low-clutter mobile-only swipeable sponsor chips.
 * Max 1 per page. Horizontally scrollable on mobile.
 */
export function StickyMobileChipRail({ creatives, rotationSeconds = 6 }: StickyMobileChipRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [autoIndex, setAutoIndex] = useState(0);

  const advance = useCallback(() => {
    if (creatives.length <= 1 || !railRef.current) return;
    const next = (autoIndex + 1) % creatives.length;
    setAutoIndex(next);
    const child = railRef.current.children[next] as HTMLElement;
    if (child) {
      railRef.current.scrollTo({ left: child.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [autoIndex, creatives.length]);

  useEffect(() => {
    if (creatives.length <= 1) return;
    const timer = setInterval(advance, rotationSeconds * 1000);
    return () => clearInterval(timer);
  }, [advance, rotationSeconds, creatives.length]);

  if (creatives.length === 0) return null;

  return (
    <div data-sponsor data-slot="sticky_mobile_chip_rail" className="sponsor-slot lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-[#0a0e1a]/90 backdrop-blur-lg border-t border-white/5 safe-area-bottom">
      <div ref={railRef} className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        {creatives.map((c, i) => (
          <a
            key={c.creative_id ?? i}
            href={c.cta_url}
            className="snap-start flex-shrink-0 flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5 hover:border-accent/20 transition-colors"
          >
            {c.logo_url && <img src={c.logo_url} alt="" className="w-4 h-4 rounded object-contain" />}
            <span className="text-[10px] text-gray-300 font-medium whitespace-nowrap max-w-[120px] truncate">{c.headline}</span>
            <span className="text-[8px] text-gray-600 uppercase">{c.sponsor_label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
