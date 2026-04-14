'use client';
// components/home/AdGridSlot.tsx
// Reads from hc_adgrid_inventory via /api/adgrid/serve.
// Shows self-serve CTA when no ad is booked.
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdGridSlotProps {
  zone: string;
  roleTargeted?: boolean;
  className?: string;
  /** If true, show "Sponsor this space" CTA when no ad. Default: true */
  showEmptyCta?: boolean;
}

interface Ad {
  id: string;
  headline: string;
  body: string;
  cta_label: string;
  cta_url: string;
  advertiser_name: string;
}

export function AdGridSlot({ zone, className, showEmptyCta = true }: AdGridSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const role = (() => { try { return localStorage.getItem('hc_role'); } catch { return null; } })();
    fetch(`/api/adgrid/serve?zone=${zone}${role ? `&role=${role}` : ''}`)
      .then(r => r.json())
      .then(d => { if (d.ad) setAd(d.ad); setLoaded(true); })
      .catch(() => { setLoaded(true); });
  }, [zone]);

  const handleClick = () => {
    if (!ad) return;
    fetch('/api/adgrid/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'click',
        creative_id: ad.id,
        surface: zone,
      }),
    }).catch(() => {});
  };

  // Sponsored content
  if (ad) {
    return (
      <div
        className={`bg-[#0f1a0c] border border-dashed border-[#3a5e10] rounded-lg p-3 ${className ?? ''}`}
        data-adgrid-zone={zone}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7ec850] inline-block" />
          <span className="text-[9px] tracking-[0.1em] text-[#4a7820]">SPONSORED</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#a0c880] mb-0.5">{ad.headline}</p>
            <p className="text-xs text-[#6a9050]">{ad.body}</p>
          </div>
          <a
            href={ad.cta_url}
            target="_blank"
            rel="noopener sponsored"
            className="flex-shrink-0 text-xs bg-[#22401a] text-[#7ec850] border border-[#3a6020] px-3 py-1.5 rounded hover:bg-[#2a5020] transition-colors"
            onClick={handleClick}
          >
            {ad.cta_label}
          </a>
        </div>
        <p className="text-[9px] text-[#2a4010] mt-1.5 text-right">{ad.advertiser_name} · AdGrid</p>
      </div>
    );
  }

  // Empty slot CTA — self-serve revenue path
  if (loaded && showEmptyCta) {
    return (
      <Link
        href={`/advertise/buy?zone=${zone}`}
        className={`group block rounded-lg border border-dashed border-white/8 bg-white/[0.015] p-3 text-center transition-all hover:border-amber-500/25 hover:bg-amber-500/[0.03] ${className ?? ''}`}
        data-adgrid-zone={zone}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">
          Sponsor this space
        </span>
        <span className="block text-[10px] text-amber-400/50 font-medium mt-0.5 group-hover:text-amber-400/80 transition-colors">
          From $0.75/click →
        </span>
      </Link>
    );
  }

  return null;
}

