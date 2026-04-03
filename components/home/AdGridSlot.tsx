'use client';
// components/home/AdGridSlot.tsx
// Reads from hc_adgrid_inventory. Self-serve AdGrid ads.
import { useEffect, useState } from 'react';

interface AdGridSlotProps {
  zone: string;
  roleTargeted?: boolean;
  className?: string;
}

interface Ad {
  id: string;
  headline: string;
  body: string;
  cta_label: string;
  cta_url: string;
  advertiser_name: string;
}

export function AdGridSlot({ zone, className }: AdGridSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const role = (() => { try { return localStorage.getItem('hc_role'); } catch { return null; } })();
    fetch(`/api/adgrid/serve?zone=${zone}${role ? `&role=${role}` : ''}`)
      .then(r => r.json())
      .then(d => d.ad && setAd(d.ad))
      .catch(() => {});
  }, [zone]);

  if (!ad) return null; // graceful empty — no placeholder shown if no ad

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
          onClick={() => fetch(`/api/adgrid/click?id=${ad.id}`, { method: 'POST' }).catch(() => {})}
        >
          {ad.cta_label}
        </a>
      </div>
      <p className="text-[9px] text-[#2a4010] mt-1.5 text-right">{ad.advertiser_name} · AdGrid</p>
    </div>
  );
}
