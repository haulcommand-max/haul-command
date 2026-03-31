'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { ServedAd } from '@/lib/ads/adrank';

/**
 * HeroBillboard — Rotating top-of-page sponsor with crossfade animation.
 * 
 * Merged into root app's ad system. Uses ServedAd from adrank.ts.
 * Displays labeled sponsor ads with auto-rotation.
 */

interface HeroBillboardProps {
  ads: ServedAd[];
  rotationMs?: number;
  className?: string;
}

export function HeroBillboard({ ads, rotationMs = 8000, className = '' }: HeroBillboardProps) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % ads.length);
        setFading(false);
      }, 400);
    }, rotationMs);
    return () => clearInterval(timer);
  }, [ads.length, rotationMs]);

  if (!ads.length) return null;
  const ad = ads[idx];

  const handleClick = useCallback(() => {
    if (ad.cta_url) {
      const isHouse = ad.campaign_id === 'house' || ad.price_model === 'house';
      if (isHouse) {
        window.location.href = ad.cta_url;
      } else {
        window.open(ad.cta_url, '_blank', 'noopener');
      }
    }
  }, [ad]);

  return (
    <div
      className={className}
      style={{
        padding: '20px 24px',
        borderRadius: 20,
        border: '1px solid rgba(198, 146, 58, 0.15)',
        background: 'linear-gradient(135deg, rgba(12, 16, 22, 0.95), rgba(20, 16, 10, 0.9))',
        cursor: 'pointer',
        transition: 'opacity 0.4s ease',
        opacity: fading ? 0.3 : 1,
        position: 'relative',
      }}
      onClick={handleClick}
    >
      {/* Sponsor Label */}
      <div style={{
        position: 'absolute', top: 12, right: 14,
        fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--hc-subtle)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4,
        padding: '2px 6px',
      }}>
        Sponsored
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {ad.image_url && (
          <div style={{
            width: 80, height: 80, borderRadius: 14, overflow: 'hidden',
            flexShrink: 0, background: 'rgba(255,255,255,0.04)',
          }}>
            <img src={ad.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--hc-text)' }}>
            {ad.headline}
          </h4>
          {ad.body && (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--hc-muted)', lineHeight: 1.5 }}>
              {ad.body}
            </p>
          )}
          <span style={{
            display: 'inline-block', marginTop: 10,
            padding: '6px 14px', fontSize: 12, fontWeight: 800,
            color: 'var(--hc-gold-400)', background: 'rgba(198, 146, 58, 0.1)',
            borderRadius: 8, border: '1px solid rgba(198, 146, 58, 0.2)',
          }}>
            {ad.cta_text}
          </span>
        </div>
      </div>

      {/* Rotation dots */}
      {ads.length > 1 && (
        <div style={{
          display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12,
        }}>
          {ads.map((_, i) => (
            <button aria-label="Interactive Button" key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: i === idx ? 'var(--hc-gold-400)' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
