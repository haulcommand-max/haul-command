'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MobileAppNav } from '@/components/mobile/MobileAppNav';

/* ══════════════════════════════════════════════════════════════
   Mobile Corridor Cards — Frame 9
   Corridor grid with demand indicators and quick stats
   390px, card-based, native app feel
   ══════════════════════════════════════════════════════════════ */

interface Corridor {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  demand: 'low' | 'moderate' | 'high' | 'surge';
  activeLoads: number;
  escortsAvailable: number;
  avgRate: string;
}

const MOCK_CORRIDORS: Corridor[] = [
  { id: 'c1', name: 'I-10 Houston–SA', origin: 'Houston', destination: 'San Antonio', distance_km: 317, demand: 'high', activeLoads: 12, escortsAvailable: 8, avgRate: '$420' },
  { id: 'c2', name: 'I-35 Dallas–Austin', origin: 'Dallas', destination: 'Austin', distance_km: 315, demand: 'surge', activeLoads: 18, escortsAvailable: 5, avgRate: '$580' },
  { id: 'c3', name: 'I-45 Houston–Dallas', origin: 'Houston', destination: 'Dallas', distance_km: 385, demand: 'moderate', activeLoads: 7, escortsAvailable: 11, avgRate: '$390' },
  { id: 'c4', name: 'I-20 Midland–Abilene', origin: 'Midland', destination: 'Abilene', distance_km: 245, demand: 'low', activeLoads: 2, escortsAvailable: 6, avgRate: '$310' },
  { id: 'c5', name: 'I-10 El Paso–SA', origin: 'El Paso', destination: 'San Antonio', distance_km: 892, demand: 'high', activeLoads: 9, escortsAvailable: 3, avgRate: '$720' },
  { id: 'c6', name: 'I-30 Dallas–Texarkana', origin: 'Dallas', destination: 'Texarkana', distance_km: 290, demand: 'moderate', activeLoads: 4, escortsAvailable: 7, avgRate: '$350' },
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
    <Link href={`/escort/corridor/${corridor.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
              {corridor.distance_km} km · {corridor.name}
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
          <button key={f}
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
            <div key={corridor.id} style={{ animationDelay: `${i * 50}ms` }}>
              <CorridorCard corridor={corridor} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 'var(--m-3xl)' }} />
      <MobileAppNav />
    </div>
  );
}
