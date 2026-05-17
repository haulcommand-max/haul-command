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
  ad_id?: string;
  creative_id?: string;
  headline: string;
  body: string;
  description?: string;
  cta_label: string;
  cta_text?: string;
  cta_url: string;
  advertiser_name?: string;
  sponsor_label?: string;
  proof_label?: string;
  image_url?: string;
  image_landscape_url?: string;
  image_square_url?: string;
  visual_alt?: string;
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
        creative_id: ad.creative_id ?? ad.id ?? ad.ad_id,
        surface: zone,
      }),
    }).catch(() => {});
  };

  // Sponsored content
  if (ad) {
    const imageUrl = ad.image_landscape_url || ad.image_url || ad.image_square_url;
    const ctaLabel = ad.cta_label || ad.cta_text || 'Learn more';
    const body = ad.body || ad.description || '';
    const sponsor = ad.advertiser_name || ad.sponsor_label || ad.proof_label || 'Haul Command';

    return (
      <div
        className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className ?? ''}`}
        style={{ borderTop: '3px solid #C6923A' }}
        data-adgrid-zone={zone}
      >
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C6923A]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sponsored</span>
            </div>
            <p className="mb-1 text-sm font-bold text-[#111827]">{ad.headline}</p>
            {body && <p className="mb-3 text-xs leading-relaxed text-[#4B5563]">{body}</p>}
            <a
              href={ad.cta_url}
              rel="sponsored"
              className="inline-block rounded-md border border-[#D1D5DB] bg-[#F3F4F6] px-3 py-1.5 text-xs font-bold text-[#374151] transition-all hover:bg-[#E5E7EB] hover:text-[#111827]"
              onClick={handleClick}
            >
              {ctaLabel}
            </a>
            <p className="mt-3 text-[10px] text-[#9CA3AF]">Sponsored by {sponsor}</p>
          </div>
          {imageUrl && (
            <a
              href={ad.cta_url}
              rel="sponsored"
              onClick={handleClick}
              className="relative block min-h-[170px] border-t border-gray-200 md:border-l md:border-t-0"
              aria-label={ctaLabel}
            >
              <img
                src={imageUrl}
                alt={ad.visual_alt || `${sponsor} sponsor visual`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
            </a>
          )}
        </div>
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

