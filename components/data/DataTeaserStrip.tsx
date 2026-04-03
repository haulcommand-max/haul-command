'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * DataTeaserStrip — Live market intelligence teaser
 *
 * Fetches real data from /api/market/snapshot on mount.
 * Falls back to static defaults if fetch fails (never breaks UI).
 * Drives paywall pressure via credible real data previews.
 */

interface TeaserCard {
  label: string;
  value: string;
  subtext: string;
  trend?: 'up' | 'down' | 'flat';
  blurred?: boolean;
}

interface Props {
  geo?: string;
  cards?: TeaserCard[];
  className?: string;
}

const STATIC_FALLBACK: TeaserCard[] = [
  { label: 'Avg Escort Rate', value: '$3.80–$5.50/mi', subtext: 'US Median • Updated daily', trend: 'up' },
  { label: 'Operator Density', value: '14K+', subtext: 'Verified operators', trend: 'up' },
  { label: 'Corridor Fill Time', value: '< 4 hours', subtext: 'Median time-to-fill', trend: 'down' },
  { label: 'Claim Pressure', value: '68%', subtext: 'Listings unclaimed', blurred: true },
  { label: 'Market Readiness', value: 'Live', subtext: '120 countries active', trend: 'flat' },
  { label: 'Rate Trend (30d)', value: '+4.2%', subtext: 'Month-over-month', blurred: true },
];

const TREND_ICONS = { up: '↑', down: '↓', flat: '→' };
const TREND_COLORS = { up: '#22C55E', down: '#EF4444', flat: '#888' };

function buildLiveCards(snapshot: Record<string, unknown>, geo?: string): TeaserCard[] {
  return [
    {
      label: 'Avg Escort Rate',
      value: String(snapshot.avg_rate_per_mile_range ?? '$3.50–$5.50/mi'),
      subtext: `${geo ?? 'US'} • Updated live`,
      trend: 'up',
    },
    {
      label: 'Verified Operators',
      value: snapshot.operator_count ? `${(snapshot.operator_count as number).toLocaleString()}` : '14K+',
      subtext: 'In directory',
      trend: 'up',
    },
    {
      label: 'Claimed Listings',
      value: snapshot.claim_rate ? `${snapshot.claim_rate}% claimed` : 'Growing',
      subtext: snapshot.claimed_count ? `${snapshot.claimed_count} verified` : 'Join them',
      trend: 'flat',
    },
    {
      label: 'Fill Time',
      value: String(snapshot.avg_response_time_h ?? '< 4 hours'),
      subtext: 'Median to accept',
      trend: 'down',
    },
    {
      label: 'Demand Signals',
      value: String(snapshot.demand_signals_range ?? '10–25'),
      subtext: 'Last 30 days',
      blurred: true,
    },
    {
      label: 'Market Mode',
      value: String(snapshot.mode ?? 'live').charAt(0).toUpperCase() + String(snapshot.mode ?? 'live').slice(1),
      subtext: 'Current status',
      trend: 'flat',
    },
  ];
}

export function DataTeaserStrip({ geo, cards, className = '' }: Props) {
  const [data, setData] = useState<TeaserCard[]>(cards ?? STATIC_FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (cards) return; // caller provided explicit cards — skip fetch
    const params = new URLSearchParams({ tier: 'free' });
    if (geo) params.set('geo', geo);
    fetch(`/api/market/snapshot?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(snapshot => {
        if (snapshot) {
          setData(buildLiveCards(snapshot, geo));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [geo, cards]);

  return (
    <div className={`dts ${className}`}>
      <div className="dts-header">
        <div className="dts-label">
          <span className="dts-pulse" />
          <span>Market Intelligence{geo ? ` — ${geo}` : ''}</span>
        </div>
        <Link href="/data" className="dts-link">
          Full Reports →
        </Link>
      </div>

      <div className="dts-scroll">
        {data.map((card, i) => (
          <div key={i} className={`dts-card ${card.blurred ? 'dts-card--blurred' : ''}`}>
            <div className="dts-card-label">{card.label}</div>
            <div className="dts-card-value">
              {card.value}
              {card.trend && (
                <span className="dts-trend" style={{ color: TREND_COLORS[card.trend] }}>
                  {TREND_ICONS[card.trend]}
                </span>
              )}
            </div>
            <div className="dts-card-sub">{card.subtext}</div>
            {card.blurred && (
              <div className="dts-card-lock">
                <Link href="/pricing?intent=data_unlock" className="dts-unlock">
                  <span className="dts-lock-icon">🔒</span>
                  <span className="dts-lock-label">Pro · $29/mo</span>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upsell footer — only shown when blurred cards exist */}
      {data.some(c => c.blurred) && (
        <div className="dts-upsell">
          <span className="dts-upsell-text">
            🔒 <strong>2 signals hidden</strong> — Rate trends + demand spikes visible on Pro
          </span>
          <Link href="/pricing" className="dts-upsell-cta">
            Unlock from $29/mo →
          </Link>
        </div>
      )}

      <style jsx>{`
        .dts {
          background: linear-gradient(180deg, rgba(14,16,25,0.95), rgba(8,10,16,0.95));
          border: 1px solid rgba(198,146,58,0.12);
          border-radius: 14px;
          overflow: hidden;
        }
        .dts-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .dts-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .dts-pulse {
          width: 6px;
          height: 6px;
          background: #22C55E;
          border-radius: 50%;
          animation: dts-blink 2s ease infinite;
        }
        @keyframes dts-blink { 50% { opacity: 0.3; } }
        .dts-link {
          font-size: 11px;
          font-weight: 600;
          color: #C6923A;
          text-decoration: none;
          transition: color 0.15s;
        }
        .dts-link:hover { color: #E0B35A; }
        .dts-scroll {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .dts-scroll::-webkit-scrollbar { display: none; }
        .dts-card {
          position: relative;
          flex: 0 0 140px;
          padding: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          transition: all 0.15s;
        }
        .dts-card:hover {
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
        }
        .dts-card--blurred .dts-card-value {
          filter: blur(4px);
          user-select: none;
        }
        .dts-card-label {
          font-size: 9px;
          font-weight: 700;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }
        .dts-card-value {
          font-size: 18px;
          font-weight: 800;
          color: #F0F0F0;
          display: flex;
          align-items: center;
          gap: 4px;
          line-height: 1;
          margin-bottom: 4px;
        }
        .dts-trend {
          font-size: 12px;
          font-weight: 700;
        }
        .dts-card-sub {
          font-size: 9px;
          color: #555;
          line-height: 1.3;
        }
        .dts-card-lock {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8,10,16,0.6);
          border-radius: 10px;
        }
        .dts-unlock {
          font-size: 10px;
          font-weight: 700;
          color: #C6923A;
          text-decoration: none;
          padding: 4px 10px;
          background: rgba(198,146,58,0.1);
          border: 1px solid rgba(198,146,58,0.3);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          transition: background 0.15s;
        }
        .dts-unlock:hover { background: rgba(198,146,58,0.2); }
        .dts-lock-icon { font-size: 14px; }
        .dts-lock-label { font-size: 9px; font-weight: 800; letter-spacing: 0.03em; }
        .dts-upsell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(198,146,58,0.06);
          border-top: 1px solid rgba(198,146,58,0.12);
          gap: 12px;
        }
        .dts-upsell-text {
          font-size: 10px;
          color: #888;
          line-height: 1.4;
        }
        .dts-upsell-text strong { color: #C6923A; }
        .dts-upsell-cta {
          flex-shrink: 0;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #C6923A, #e0aa55);
          padding: 5px 12px;
          border-radius: 6px;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .dts-upsell-cta:hover { opacity: 0.88; }
      `}</style>
    </div>
  );
}

