'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { ServedAd } from '@/lib/ads/adrank';

/**
 * StickyMobileChipRail — Mobile-only swipeable sponsor chip bar.
 * 
 * Fixed above bottom navigation. Auto-scrolls through creatives.
 * Only renders on mobile viewport (< 768px).
 */

interface StickyMobileChipRailProps {
  ads: ServedAd[];
  scrollMs?: number;
}

export function StickyMobileChipRail({ ads, scrollMs = 6000 }: StickyMobileChipRailProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % ads.length);
    }, scrollMs);
    return () => clearInterval(timer);
  }, [ads.length, scrollMs]);

  const handleClick = useCallback((ad: ServedAd) => {
    if (ad.cta_url) {
      const isHouse = ad.campaign_id === 'house' || ad.price_model === 'house';
      if (isHouse) window.location.href = ad.cta_url;
      else window.open(ad.cta_url, '_blank', 'noopener');
    }
  }, []);

  if (!ads.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 68, left: 0, right: 0,
      zIndex: 40, padding: '8px 12px',
      background: 'linear-gradient(to top, rgba(8,10,14,0.95), rgba(8,10,14,0.8))',
      backdropFilter: 'blur(12px)',
      display: 'none', // hidden on desktop
    }}
    className="mobile-chip-rail"
    >
      <style>{`
        @media (max-width: 767px) {
          .mobile-chip-rail { display: flex !important; gap: 8px; overflow-x: auto; }
          .mobile-chip-rail::-webkit-scrollbar { display: none; }
        }
      `}</style>
      {ads.map((ad, i) => (
        <button
          key={ad.ad_id}
          onClick={() => handleClick(ad)}
          style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 999,
            border: i === idx ? '1px solid rgba(198,146,58,0.3)' : '1px solid rgba(255,255,255,0.08)',
            background: i === idx ? 'rgba(198,146,58,0.1)' : 'rgba(255,255,255,0.04)',
            color: 'var(--hc-text)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{ fontSize: 9, color: 'var(--hc-subtle)', marginRight: 6, textTransform: 'uppercase' }}>
            Ad
          </span>
          {ad.headline.slice(0, 28)}{ad.headline.length > 28 ? '…' : ''}
        </button>
      ))}
    </div>
  );
}
