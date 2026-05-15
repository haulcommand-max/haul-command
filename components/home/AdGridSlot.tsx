'use client';
// components/home/AdGridSlot.tsx
// Reads from /api/adgrid/serve and always leaves a monetizable fallback.
// Paid ads win. House ads keep the slot useful when inventory is empty or AdGrid is degraded.
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
  is_house?: boolean;
}

const CLIENT_HOUSE_ADS: Record<string, Ad> = {
  directory_sponsor: {
    id: 'house-directory-sponsor',
    headline: 'Own the next heavy-haul support search',
    body: 'Sponsor pilot car, permit, parking, repair, staging, and route-support discovery moments before a move stalls.',
    cta_label: 'Sponsor this market',
    cta_url: '/advertise/buy?zone=directory_sponsor',
    advertiser_name: 'Haul Command',
    is_house: true,
  },
  directory_gap: {
    id: 'house-directory-gap',
    headline: 'Be the first answer in a low-supply market',
    body: 'Put your company in front of buyers searching for hard-to-find heavy-haul support by role, country, corridor, and urgency.',
    cta_label: 'Claim the gap',
    cta_url: '/advertise/buy?zone=directory_gap',
    advertiser_name: 'Haul Command',
    is_house: true,
  },
  default: {
    id: 'house-adgrid-default',
    headline: 'Sponsor a high-intent Haul Command surface',
    body: 'Reach brokers, carriers, operators, suppliers, yards, and support providers at the moment they are planning or rescuing a move.',
    cta_label: 'View sponsor options',
    cta_url: '/advertise',
    advertiser_name: 'Haul Command',
    is_house: true,
  },
};

function getClientHouseAd(zone: string): Ad {
  return CLIENT_HOUSE_ADS[zone] ?? CLIENT_HOUSE_ADS.default;
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function AdGridSlot({ zone, className, showEmptyCta = true }: AdGridSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const role = (() => { try { return localStorage.getItem('hc_role'); } catch { return null; } })();
    fetch(`/api/adgrid/serve?zone=${encodeURIComponent(zone)}${role ? `&role=${encodeURIComponent(role)}` : ''}`)
      .then(r => r.json())
      .then(d => {
        setAd(d.ad ?? getClientHouseAd(zone));
        setLoaded(true);
      })
      .catch(() => {
        setAd(getClientHouseAd(zone));
        setLoaded(true);
      });
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
        is_house: Boolean(ad.is_house),
      }),
    }).catch(() => {});
  };

  // Sponsored or house content. House content is intentionally visible instead of a dead empty slot.
  if (ad) {
    const external = isExternalUrl(ad.cta_url);
    return (
      <div
        className={`bg-white border border-gray-200 shadow-sm rounded-lg p-4 ${className ?? ''}`}
        style={{ borderTop: '3px solid #C6923A' }}
        data-adgrid-zone={zone}
        data-adgrid-house={ad.is_house ? 'true' : 'false'}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6923A] inline-block" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF]">
            {ad.is_house ? 'HOUSE AD' : 'SPONSORED'}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111827] mb-1">{ad.headline}</p>
            <p className="text-xs text-[#4B5563] mb-3 leading-relaxed">{ad.body}</p>
          </div>
        </div>
        <a
          href={ad.cta_url}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener sponsored' : undefined}
          className="inline-block text-xs font-bold bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] px-3 py-1.5 rounded-md hover:bg-[#E5E7EB] hover:text-[#111827] transition-all"
          onClick={handleClick}
        >
          {ad.cta_label}
        </a>
        <p className="text-[10px] text-[#9CA3AF] mt-3 text-right">Sponsored by {ad.advertiser_name}</p>
      </div>
    );
  }

  // Final dead-stop fallback should almost never render now.
  if (loaded && showEmptyCta) {
    return (
      <Link
        href={`/advertise/buy?zone=${encodeURIComponent(zone)}`}
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
