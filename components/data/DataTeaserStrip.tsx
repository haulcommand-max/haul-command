'use client';

import React from 'react';
import Link from 'next/link';

/**
 * DataTeaserStrip — Public data teaser previews
 * 
 * Shows blurred/partial data snapshots to drive /data purchases.
 * Per the data_monetization_aggression_overlay:
 * - market snapshots, corridor snapshots, claim density previews,
 *   rate previews, readiness heat previews
 * 
 * Renders as a horizontal scrolling strip of teaser cards.
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

const DEFAULT_CARDS: TeaserCard[] = [
  { label: 'Avg Escort Rate', value: '$1.85/mi', subtext: 'US Median • Updated daily', trend: 'up' },
  { label: 'Operator Density', value: '7,743', subtext: 'Verified operators', trend: 'up' },
  { label: 'Corridor Fill Time', value: '3.8 hrs', subtext: 'Median time-to-fill', trend: 'down' },
  { label: 'Claim Pressure', value: '78%', subtext: 'Listings unclaimed', blurred: true },
  { label: 'Market Readiness', value: 'A+', subtext: 'US coverage score', trend: 'flat' },
  { label: 'Rate Trend (30d)', value: '+4.2%', subtext: 'Month-over-month', blurred: true },
];

const TREND_ICONS = { up: '↑', down: '↓', flat: '→' };
const TREND_COLORS = { up: '#22C55E', down: '#EF4444', flat: '#888' };

export function DataTeaserStrip({ geo, cards, className = '' }: Props) {
  const data = cards ?? DEFAULT_CARDS;

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
                <Link href="/data" className="dts-unlock">🔒 Unlock</Link>
              </div>
            )}
          </div>
        ))}
      </div>

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
        }
      `}</style>
    </div>
  );
}
