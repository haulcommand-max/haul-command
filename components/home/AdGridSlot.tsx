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
        className={`bg-white border border-gray-200 shadow-sm rounded-lg p-4 ${className ?? ''}`}
        style={{ borderTop: '3px solid #C6923A' }}
        data-adgrid-zone={zone}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6923A] inline-block" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF]">SPONSORED</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111827] mb-1">{ad.headline}</p>
            <p className="text-xs text-[#4B5563] mb-3 leading-relaxed">{ad.body}</p>
          </div>
        </div>
        <a
          href={ad.cta_url}
          target="_blank"
          rel="noopener sponsored"
          className="inline-block text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] px-3 py-1.5 rounded-md hover:bg-[#E5E7EB] hover:text-[#111827] transition-all"
          onClick={handleClick}
        >
          {ad.cta_label}
        </a>
        <p className="text-[10px] text-[#9CA3AF] mt-3 text-right">Sponsored by {ad.advertiser_name}</p>
      </div>
    );
  }

  // Empty slot CTA — self-serve revenue path
  if (loaded && showEmptyCta) {
    return (
      <Link
        href={`/advertise/buy?zone=${zone}`}
        className={`group block rounded-lg border border-dashed border-[#D1D5DB] bg-[#F9FAFB] p-5 text-center transition-all hover:border-[#C6923A] hover:bg-[#FFFBEB] ${className ?? ''}`}
        data-adgrid-zone={zone}
      >
        <span className="block text-xs font-bold uppercase tracking-widest text-[#6B7280] group-hover:text-[#B45309] transition-colors">
          Sponsor this space
        </span>
        <span className="block text-[11px] text-[#9CA3AF] font-medium mt-1 group-hover:text-[#D97706] transition-colors">
          Target local directory searches →
        </span>
      </Link>
    );
  }

  return null;
}

