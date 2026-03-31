'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CorridorSponsorCard } from './CorridorSponsorCard';
/* Nav provided by (app)/layout.tsx — do NOT import MobileAppNav here */

/* ══════════════════════════════════════════════════════════════
   Mobile Corridor Cards — Frame 9
   Corridor grid with demand indicators and quick stats
   390px, card-based, native app feel
   ══════════════════════════════════════════════════════════════ */

interface Corridor {
  slug: string;
  name: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  demand: 'low' | 'moderate' | 'high' | 'surge';
  activeLoads: number;
  escortsAvailable: number;
  avgRate: string;
}

const MOCK_CORRIDORS: Corridor[] = [
  { slug: 'i-10', name: 'I-10 Gulf Coast', origin: 'Los Angeles, CA', destination: 'Jacksonville, FL', distanceMiles: 2460, demand: 'surge', activeLoads: 12, escortsAvailable: 8, avgRate: '$420' },
  { slug: 'i-35', name: 'I-35 Central Spine', origin: 'Laredo, TX', destination: 'Duluth, MN', distanceMiles: 1568, demand: 'high', activeLoads: 10, escortsAvailable: 6, avgRate: '$510' },
  { slug: 'i-75', name: 'I-75 Southeast', origin: 'Miami, FL', destination: 'Sault Ste. Marie, MI', distanceMiles: 1786, demand: 'high', activeLoads: 9, escortsAvailable: 7, avgRate: '$465' },
  { slug: 'i-20', name: 'I-20 Deep South', origin: 'Pecos, TX', destination: 'Florence, SC', distanceMiles: 1534, demand: 'moderate', activeLoads: 6, escortsAvailable: 5, avgRate: '$390' },
];

const DEMAND_CONFIG = {
  low:      { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Low' },
  moderate: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Moderate' },
  high:     { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'High' },
  surge:    { color: '#F1A91B', bg: 'rgba(241,169,27,0.15)', label: '🔥 Surge' },
};

function CorridorCard({ corridor }: { corridor: Corridor }) {
  const dc = DEMAND_CONFIG[corridor.demand];
  const supplyRatio = corridor.escortsAvailable / Math.max(corridor.activeLoads, 1);

  return (
    <Link aria-label="Navigation Link" href={`/corridor/${corridor.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="m-card m-animate-slide-up" style={{
        borderLeft: corridor.demand === 'surge' ? '3px solid var(--m-gold)' : undefined,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--m-sm)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--m-font-body)', fontWeight: 800,
              color: 'var(--m-text-primary)', lineHeight: 1.2,
            }}>
              {corridor.origin} → {corridor.destination}
            </div>
            <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
              {corridor.distanceMiles.toLocaleString()} mi · {corridor.name}
            </div>
          </div>
          <span style={{
            fontSize: 'var(--m-font-overline)', fontWeight: 800,
            color: dc.color, background: dc.bg,
            padding: '3px 8px', borderRadius: 'var(--m-radius-full)',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            {dc.label}
          </span>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: 'var(--m-md)',
          paddingTop: 'var(--m-sm)',
          borderTop: '1px solid var(--m-border-subtle)',
        }}>
          <div>
            <div style={{ fontSize: 'var(--m-font-h3)', fontWeight: 900, color: 'var(--m-text-primary)' }}>
              {corridor.activeLoads}
            </div>
            <div style={{ fontSize: 'var(--m-font-overline)', color: 'var(--m-text-muted)', fontWeight: 600 }}>
              Active
            </div>
          </div>
          <div>
            <div style={{
              fontSize: 'var(--m-font-h3)', fontWeight: 900,
              color: supplyRatio < 0.5 ? '#EF4444' : supplyRatio < 1 ? '#F59E0B' : '#22C55E',
            }}>
              {corridor.escortsAvailable}
            </div>
            <div style={{ fontSize: 'var(--m-font-overline)', color: 'var(--m-text-muted)', fontWeight: 600 }}>
              Escorts
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--m-font-h3)', fontWeight: 900, color: 'var(--m-gold)' }}>
              {corridor.avgRate}
            </div>
            <div style={{ fontSize: 'var(--m-font-overline)', color: 'var(--m-text-muted)', fontWeight: 600 }}>
              Avg Rate
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MobileCorridors() {
  const [filter, setFilter] = useState<string>('all');
  const filters = ['all', 'surge', 'high', 'moderate', 'low'];
  const filtered = filter === 'all'
    ? MOCK_CORRIDORS
    : MOCK_CORRIDORS.filter(c => c.demand === filter);

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
        }}>Corridors</h1>
        <p style={{
          fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)',
          margin: 'var(--m-xs) 0 0',
        }}>{MOCK_CORRIDORS.length} active corridors</p>
      </div>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 'var(--m-xs)',
        padding: 'var(--m-md) var(--m-screen-pad)',
        overflowX: 'auto',
      }}>
        {filters.map(f => (
          <button aria-label="Interactive Button" key={f}
            onClick={() => setFilter(f)}
            className={`m-chip ${filter === f ? 'm-chip--gold' : 'm-chip--tag'}`}
            style={{
              cursor: 'pointer', border: 'none',
              fontWeight: filter === f ? 800 : 600,
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <div className="m-list">
          {filtered.map((corridor, i) => (
            <div key={corridor.slug} style={{ animationDelay: `${i * 50}ms` }}>
              <CorridorCard corridor={corridor} />
            </div>
          ))}
        </div>
      </div>

      {/* Corridor sponsor unit */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <CorridorSponsorCard
          corridorName="your target corridor"
          corridorSlug=""
          operatorCount={filtered.reduce((s, c) => s + c.escortsAvailable, 0)}
        />
      </div>

      <div style={{ height: 'var(--m-3xl)' }} />
      {/* Nav handled by layout */}
    </div>
  );
}
