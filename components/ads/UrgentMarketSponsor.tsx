'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MarketMode } from '@/lib/swarm/market-mode-governor';

/**
 * UrgentMarketSponsor — Market-mode-aware ad/CTA surface
 *
 * Per the adgrid_aggression_overlay:
 *  "urgent market sponsor" and "empty market launch sponsor"
 *
 * Renders different surfaces based on market mode:
 *  - seeding      → "Be first in this market" launch sponsorship CTA
 *  - shortage      → Pulsing URGENT banner, recruiter-style
 *  - rescue        → Max urgency, red flashing, emergency CTA
 *  - waitlist      → Waitlist premium access offer
 *  - live          → Standard sponsor slot (via AdGridSlot)
 *  - demand_capture → Broker lead capture offer
 *
 * Reads market mode from:
 *  1. Props (if parent fetched it server-side)
 *  2. Falls back to /api/market/mode?key= client-side
 */

interface Props {
  marketKey: string;     // e.g. "us-texas-houston"
  geo?: string;          // Display name e.g. "Houston, TX"
  mode?: MarketMode;     // Optionally pass from server
  className?: string;
}

const MODE_CONFIG: Record<MarketMode, {
  badge: string;
  badgeColor: string;
  bg: string;
  border: string;
  headline: string;
  sub: string;
  cta: string;
  ctaHref: string;
  ctaColor: string;
  pulse?: boolean;
  icon: string;
}> = {
  seeding: {
    badge: '🌱 MARKET LAUNCHING',
    badgeColor: '#22C55E',
    bg: 'rgba(34,197,94,0.04)',
    border: 'rgba(34,197,94,0.15)',
    headline: 'Be the first verified operator in this market',
    sub: 'Claim territory exclusivity before anyone else. Launch pricing available for 30 days.',
    cta: 'Claim Launch Package →',
    ctaHref: '/advertise/territory?intent=launch',
    ctaColor: 'linear-gradient(135deg, #22C55E, #16A34A)',
    icon: '🚀',
  },
  demand_capture: {
    badge: '📈 DEMAND GROWING',
    badgeColor: '#3B82F6',
    bg: 'rgba(59,130,246,0.04)',
    border: 'rgba(59,130,246,0.15)',
    headline: 'Brokers are searching this corridor now',
    sub: 'Capture demand before it goes to competitors. Claim your listing and get matched.',
    cta: 'Claim & Get Matched →',
    ctaHref: '/claim?intent=demand_capture',
    ctaColor: 'linear-gradient(135deg, #3B82F6, #2563EB)',
    icon: '📡',
  },
  waitlist: {
    badge: '⏳ HIGH DEMAND — WAITLIST ACTIVE',
    badgeColor: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    headline: 'Demand exceeds supply in this market',
    sub: 'Operators who claim now skip the waitlist and get priority placement for incoming loads.',
    cta: 'Skip Waitlist — Claim Now →',
    ctaHref: '/claim?intent=waitlist_skip',
    ctaColor: 'linear-gradient(135deg, #F59E0B, #D97706)',
    icon: '⚡',
  },
  live: {
    badge: '✅ ACTIVE MARKET',
    badgeColor: '#10B981',
    bg: 'rgba(16,185,129,0.03)',
    border: 'rgba(16,185,129,0.12)',
    headline: 'Sponsor this market — exclusive placement',
    sub: 'One exclusive sponsor per market. Your brand appears first on every search and listing in this area.',
    cta: 'View Sponsorship Options →',
    ctaHref: '/advertise/territory',
    ctaColor: 'linear-gradient(135deg, #C6923A, #8A6428)',
    icon: '🏆',
  },
  shortage: {
    badge: '🚨 OPERATOR SHORTAGE',
    badgeColor: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.2)',
    headline: 'URGENT: Loads going uncovered in this market',
    sub: 'Operators available here are earning surge rates. Claim your listing and start accepting jobs immediately.',
    cta: '⚡ Claim Now — Surge Rates Active',
    ctaHref: '/claim?intent=shortage_response',
    ctaColor: 'linear-gradient(135deg, #EF4444, #DC2626)',
    pulse: true,
    icon: '🚨',
  },
  rescue: {
    badge: '🆘 CRITICAL SHORTAGE — RESCUE MODE',
    badgeColor: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.3)',
    headline: 'CRITICAL: Loads stranded — join the rescue network',
    sub: 'This market is in rescue mode. Operators joining now receive emergency dispatch priority and rescue markup rates.',
    cta: '🆘 Join Rescue Network Now',
    ctaHref: '/claim?intent=rescue_operator',
    ctaColor: 'linear-gradient(135deg, #DC2626, #991B1B)',
    pulse: true,
    icon: '🆘',
  },
};

export function UrgentMarketSponsor({ marketKey, geo, mode: modeProp, className = '' }: Props) {
  const [mode, setMode] = useState<MarketMode>(modeProp ?? 'live');
  const [loading, setLoading] = useState(!modeProp);

  useEffect(() => {
    if (modeProp) return; // server-hydrated, skip fetch
    fetch(`/api/market/mode?key=${encodeURIComponent(marketKey)}`)
      .then(r => r.json())
      .then(d => {
        if (d.mode) setMode(d.mode);
      })
      .catch(() => {}) // silent fallback
      .finally(() => setLoading(false));
  }, [marketKey, modeProp]);

  if (loading) return null;

  const cfg = MODE_CONFIG[mode];

  return (
    <div
      className={`ums ${className}`}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        animation: cfg.pulse ? 'ums-pulse 2s ease infinite' : 'none',
      }}
      data-market-key={marketKey}
      data-market-mode={mode}
    >
      <div style={{ padding: '16px 20px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px',
          background: `${cfg.badgeColor}14`,
          border: `1px solid ${cfg.badgeColor}33`,
          borderRadius: 20,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: cfg.badgeColor, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {cfg.badge}
          </span>
        </div>

        {/* Content row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 4, lineHeight: 1.3 }}>
              {geo ? geo + ' — ' : ''}{cfg.headline}
            </div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
              {cfg.sub}
            </div>
          </div>

          <Link
            href={cfg.ctaHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 18px',
              background: cfg.ctaColor,
              borderRadius: 9, color: '#000',
              fontSize: 11, fontWeight: 800,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              boxShadow: cfg.pulse ? '0 0 20px rgba(239,68,68,0.35)' : 'none',
            }}
          >
            {cfg.cta}
          </Link>
        </div>
      </div>

      {/* Market key / AdGrid label */}
      <div style={{ padding: '4px 20px 8px', fontSize: 9, color: '#444', letterSpacing: '0.04em' }}>
        AdGrid · {marketKey} · mode:{mode}
      </div>

      <style jsx>{`
        @keyframes ums-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.15); }
        }
      `}</style>
    </div>
  );
}
