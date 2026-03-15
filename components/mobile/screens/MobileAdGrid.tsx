'use client';

import React from 'react';
import Link from 'next/link';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';

/* ══════════════════════════════════════════════════════════════
   Mobile AdGrid / Sponsors — Frame 12
   Sponsored listings, territory ads, featured placements
   390px, card-based, native app feel
   ══════════════════════════════════════════════════════════════ */

interface SponsorCard {
  id: string;
  company: string;
  tagline: string;
  tier: 'exclusive' | 'premium' | 'basic';
  territory: string;
  impressions: number;
  cta: string;
  ctaHref: string;
}

const MOCK_SPONSORS: SponsorCard[] = [
  {
    id: 's1', company: 'Texas Wide Load Escorts', tagline: 'Licensed, insured oversize load escort services across Texas',
    tier: 'exclusive', territory: 'Houston, TX', impressions: 12400,
    cta: 'Get Quote', ctaHref: '/place/texas-wide-load-escorts',
  },
  {
    id: 's2', company: 'Southern Pilot Cars', tagline: 'Professional pilot car services for heavy haul',
    tier: 'premium', territory: 'Dallas/Fort Worth', impressions: 8200,
    cta: 'View Profile', ctaHref: '/place/southern-pilot-cars',
  },
  {
    id: 's3', company: 'Gulf Coast Escorts', tagline: 'Serving the Gulf Coast region since 2015',
    tier: 'premium', territory: 'Beaumont, TX', impressions: 5600,
    cta: 'View Profile', ctaHref: '/place/gulf-coast-escorts',
  },
  {
    id: 's4', company: 'Panhandle Pilot Co', tagline: 'Oversize load specialists in the Texas Panhandle',
    tier: 'basic', territory: 'Amarillo, TX', impressions: 3100,
    cta: 'Learn More', ctaHref: '/place/panhandle-pilot',
  },
];

const TIER_CONFIG = {
  exclusive: { label: 'EXCLUSIVE', color: 'var(--m-gold)', bg: 'rgba(212,168,68,0.15)', border: 'var(--m-gold)' },
  premium:   { label: 'PREMIUM',   color: '#A78BFA',       bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  basic:     { label: 'SPONSOR',   color: 'var(--m-text-muted)', bg: 'var(--m-surface-raised)', border: 'var(--m-border-subtle)' },
};

function SponsorCardComponent({ sponsor }: { sponsor: SponsorCard }) {
  const tc = TIER_CONFIG[sponsor.tier];

  return (
    <div className="m-card m-animate-slide-up" style={{
      borderLeft: `3px solid ${tc.border}`,
      position: 'relative',
    }}>
      {/* Tier badge */}
      <div style={{
        position: 'absolute', top: 'var(--m-md)', right: 'var(--m-md)',
        fontSize: 'var(--m-font-overline)', fontWeight: 800,
        color: tc.color, background: tc.bg,
        padding: '2px 8px', borderRadius: 'var(--m-radius-full)',
        letterSpacing: '0.05em',
      }}>
        {tc.label}
      </div>

      {/* Company avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-sm)', marginBottom: 'var(--m-sm)' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--m-radius-lg)',
          background: tc.bg, border: `1px solid ${tc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: tc.color, flexShrink: 0,
        }}>
          {sponsor.company.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--m-font-body)', fontWeight: 800,
            color: 'var(--m-text-primary)', lineHeight: 1.2,
          }}>{sponsor.company}</div>
          <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
            📍 {sponsor.territory}
          </div>
        </div>
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
        lineHeight: 1.5, margin: '0 0 var(--m-md)',
      }}>{sponsor.tagline}</p>

      {/* Footer: impressions + CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
        }}>
          {sponsor.impressions.toLocaleString()} views
        </span>
        <Link href={sponsor.ctaHref}
          className="m-btn m-btn--primary m-btn--small"
          style={{ textDecoration: 'none', padding: '6px 16px' }}
        >
          {sponsor.cta}
        </Link>
      </div>
    </div>
  );
}

export default function MobileAdGrid() {
  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--m-safe-top) var(--m-screen-pad) 0',
        paddingTop: 'calc(var(--m-safe-top) + var(--m-md))',
      }}>
        <h1 style={{
          fontSize: 'var(--m-font-h1)', fontWeight: 900,
          color: 'var(--m-text-primary)', margin: 0,
        }}>Featured Providers</h1>
        <p style={{
          fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)',
          margin: 'var(--m-xs) 0 0',
        }}>Sponsored & verified escort services</p>
      </div>

      {/* Become a sponsor CTA */}
      <div style={{ padding: 'var(--m-md) var(--m-screen-pad)' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,168,68,0.1) 0%, rgba(167,139,250,0.05) 100%)',
          border: '1px solid rgba(212,168,68,0.2)',
          borderRadius: 'var(--m-radius-lg)',
          padding: 'var(--m-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-gold)' }}>
              📣 Want territory visibility?
            </div>
            <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
              Get featured in your service area
            </div>
          </div>
          <Link href="/sponsor/territory" className="m-chip m-chip--gold" style={{ textDecoration: 'none', fontSize: 'var(--m-font-caption)' }}>
            Sponsor
          </Link>
        </div>
      </div>

      {/* Sponsor cards */}
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <div className="m-list">
          {MOCK_SPONSORS.map((sponsor, i) => (
            <div key={sponsor.id} style={{ animationDelay: `${i * 60}ms` }}>
              <SponsorCardComponent sponsor={sponsor} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 'var(--m-3xl)' }} />
      <MobileAppNav />
    </div>
  );
}
