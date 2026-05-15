'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeUUID } from '@/lib/identity/uid';
import { pickHouseAd } from '@/lib/ads/house-ads';
import type { ServedAd } from '@/lib/ads/adrank';
import { useAdImpression } from './useAdImpression';

function ssGet(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function ssSet(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private browsing and quota failures should never block ads.
  }
}

function statusLabel(isHouseAd: boolean) {
  return isHouseAd ? 'Haul Command House Ad' : 'Sponsored';
}

interface NativeAdCardProps {
  placementId: string;
  surface: string;
  variant?: 'directory' | 'inline' | 'sidebar';
  userRole?: string;
  jurisdiction?: string;
  sessionId?: string;
  className?: string;
}

export function NativeAdCard({
  placementId,
  surface,
  variant = 'directory',
  userRole,
  jurisdiction,
  sessionId,
  className = '',
}: NativeAdCardProps) {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const [isHouseAd, setIsHouseAd] = useState(true);
  const [viewerKey, setViewerKey] = useState('');
  const [sid, setSid] = useState('');

  const fallbackAd = useMemo(
    () => pickHouseAd({ surface: `${surface} ${jurisdiction ?? ''}`, placementId, role: userRole }),
    [jurisdiction, placementId, surface, userRole],
  );

  useEffect(() => {
    const storedKey = ssGet('hc_viewer_key') || safeUUID();
    ssSet('hc_viewer_key', storedKey);
    setViewerKey(storedKey);

    const storedSid = sessionId || ssGet('hc_session_id') || safeUUID();
    ssSet('hc_session_id', storedSid);
    setSid(storedSid);
  }, [sessionId]);

  useEffect(() => {
    if (!viewerKey || !sid) return;

    async function fetchAd() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('serve_ad_ranked', {
          p_surface: surface,
          p_viewer_key: viewerKey,
          p_session_id: sid,
          p_geo_hash: null,
          p_context: { placementId, jurisdiction, userRole },
          p_limit: 1,
        });

        if (!error && data?.ads?.[0]) {
          const served = data.ads[0] as ServedAd;
          setAd(served);
          setIsHouseAd(served.campaign_id === 'house' || served.price_model === 'house');
          return;
        }
      } catch {
        // Fall through to house creative.
      }

      setAd(fallbackAd);
      setIsHouseAd(true);
    }

    fetchAd();
  }, [fallbackAd, jurisdiction, placementId, sid, surface, userRole, viewerKey]);

  const { ref } = useAdImpression({
    impressionToken: ad?.impression_token || null,
    sessionId: sid,
  });

  const handleClick = useCallback(async () => {
    if (!ad) return;

    try {
      const supabase = createClient();
      if (isHouseAd) {
        supabase
          .from('adgrid_events')
          .insert({
            event_type: 'click',
            ad_id: ad.ad_id,
            creative_id: ad.creative_id,
            surface,
            session_id: sid,
            metadata: { placement_id: placementId, cta_url: ad.cta_url, source: 'house' },
          })
          .then(() => {});
      } else if (ad.impression_token) {
        await supabase.rpc('record_ad_click', {
          p_impression_token: ad.impression_token,
          p_session_id: sid,
        });
      }
    } catch {
      // Tracking must not block navigation.
    }

    if (isHouseAd) {
      window.location.href = ad.cta_url;
    } else {
      window.open(ad.cta_url, '_blank', 'noopener');
    }
  }, [ad, isHouseAd, placementId, sid, surface]);

  if (!ad) return null;

  const label = statusLabel(isHouseAd);
  const image = ad.image_url;

  if (variant === 'inline') {
    return (
      <div
        ref={ref}
        className={`group flex cursor-pointer items-center gap-4 rounded-xl border border-[#C6923A]/20 bg-[#0d0f13] p-4 transition-all hover:border-[#C6923A]/40 ${className}`}
        onClick={handleClick}
      >
        {image && (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-black/40">
            <img src={image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="shrink-0 rounded border border-[#C6923A]/25 bg-[#C6923A]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#F2B84B]">
              {label}
            </span>
            <h4 className="truncate text-sm font-black text-white group-hover:text-[#F2B84B]">{ad.headline}</h4>
          </div>
          {ad.body && <p className="truncate text-xs text-slate-400">{ad.body}</p>}
        </div>
        <span className="shrink-0 rounded-md bg-[#F5A812] px-3 py-2 text-xs font-black text-black">
          {ad.cta_text}
        </span>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        ref={ref}
        className={`group cursor-pointer overflow-hidden rounded-xl border border-[#C6923A]/20 bg-[#0d0f13] p-4 transition-all hover:border-[#C6923A]/40 ${className}`}
        onClick={handleClick}
      >
        <div className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#F2B84B]">{label}</div>
        {image && (
          <div className="mb-3 h-24 overflow-hidden rounded-lg bg-black/40">
            <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>
        )}
        <h4 className="text-xs font-black text-white">{ad.headline}</h4>
        {ad.body && <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-400">{ad.body}</p>}
        <span className="mt-3 inline-block rounded-md border border-[#C6923A]/25 bg-[#C6923A]/10 px-2 py-1 text-[10px] font-black text-[#F2B84B]">
          {ad.cta_text}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-[#C6923A]/20 bg-[#0d0f13] p-5 transition-all hover:border-[#C6923A]/45 ${className}`}
      onClick={handleClick}
    >
      {image && (
        <div className="mb-4 h-36 overflow-hidden rounded-xl bg-black/40">
          <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="mb-2 inline-flex rounded border border-[#C6923A]/25 bg-[#C6923A]/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#F2B84B]">
        {label}
      </div>
      <h4 className="text-sm font-black text-white transition-colors group-hover:text-[#F2B84B]">{ad.headline}</h4>
      {ad.body && <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{ad.body}</p>}
      <span className="mt-4 inline-block rounded-md bg-[#F5A812] px-3 py-2 text-xs font-black text-black">
        {ad.cta_text}
      </span>
    </div>
  );
}
