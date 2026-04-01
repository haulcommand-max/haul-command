'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MobileScreenHeader,
  MobileCard,
  MobileChip,
  MobileChipScroll,
  MobileButton,
  MobileEmpty,
  MobileCardSkeleton,
  MobileList,
} from '@/components/mobile/MobileComponents';
/* Nav provided by (app)/layout.tsx — do NOT import MobileAppNav here */

/* ══════════════════════════════════════════════════════════════
   Mobile Load Board — Frame 4 (List Mode)
   Filter chips, stacked load cards, map toggle
   Approved spec: 390px, card-based, no tables
   ══════════════════════════════════════════════════════════════ */

const FILTERS = ['All', 'My Routes', 'Urgent', 'Near Me', 'High Pay'];

interface LoadItem {
  id: string;
  from: string;
  to: string;
  distance: string;
  escorts: number;
  pay: string;
  pickup: string;
  type: string;
  status: 'open' | 'urgent' | 'booked';
}

const MOCK_LOADS: LoadItem[] = [
  {
    id: 'HC-1401', from: 'Houston, TX', to: 'Oklahoma City, OK',
    distance: '340 mi', escorts: 2, pay: '$1,850',
    pickup: 'Mar 16, 8:00 AM', type: 'Oversize', status: 'open',
  },
  {
    id: 'HC-1402', from: 'Dallas, TX', to: 'Denver, CO',
    distance: '780 mi', escorts: 3, pay: '$3,200',
    pickup: 'Mar 17, 6:00 AM', type: 'Super Load', status: 'urgent',
  },
  {
    id: 'HC-1403', from: 'San Antonio, TX', to: 'El Paso, TX',
    distance: '550 mi', escorts: 1, pay: '$1,100',
    pickup: 'Mar 18, 10:00 AM', type: 'Wide Load', status: 'open',
  },
  {
    id: 'HC-1404', from: 'Austin, TX', to: 'Lubbock, TX',
    distance: '370 mi', escorts: 2, pay: '$1,650',
    pickup: 'Mar 19, 7:00 AM', type: 'Oversize', status: 'open',
  },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open: { bg: 'rgba(34,197,94,0.08)', color: '#22C55E', label: 'Open' },
  urgent: { bg: 'rgba(239,68,68,0.08)', color: '#EF4444', label: 'Urgent' },
  booked: { bg: 'rgba(59,130,246,0.08)', color: '#3B82F6', label: 'Booked' },
};

const MapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--m-text-muted)' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const TruckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--m-text-muted)' }}>
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export default function MobileLoadBoard() {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Header: title + map toggle */}
      <MobileScreenHeader
        title="Load Board"
        rightAction={
          <Link href="/map" style={{ textDecoration: 'none' }}>
            <button aria-label="Interactive Button" className="m-btn m-btn--secondary m-btn--small" style={{ width: 'auto', gap: 6 }}>
              <MapIcon />
              <span>Map</span>
            </button>
          </Link>
        }
      />

      {/* Filter Chips */}
      <div style={{ paddingTop: 'var(--m-md)', paddingBottom: 'var(--m-md)' }}>
        <MobileChipScroll>
          {FILTERS.map(f => (
            <MobileChip
              key={f}
              label={f}
              active={activeFilter === f}
              onClick={() => setActiveFilter(f)}
            />
          ))}
        </MobileChipScroll>
      </div>

      {/* Load Cards */}
      <MobileList>
        {MOCK_LOADS.map((load, i) => (
          <Link aria-label="Navigation Link"
            key={load.id}
            href={`/loads/${load.id}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <div className="m-card m-animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              {/* Route */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--m-font-body)', fontWeight: 700,
                    color: 'var(--m-text-primary)', lineHeight: '20px',
                  }}>
                    {load.from} → {load.to}
                  </div>

                  {/* Type badge + Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-sm)', marginTop: 'var(--m-sm)' }}>
                    <span className="m-chip m-chip--tag m-chip--gold">{load.type}</span>
                    <span style={{
                      fontSize: 'var(--m-font-overline)', fontWeight: 700,
                      padding: '3px 8px', borderRadius: 'var(--m-radius-sm)',
                      background: STATUS_STYLES[load.status].bg,
                      color: STATUS_STYLES[load.status].color,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {STATUS_STYLES[load.status].label}
                    </span>
                  </div>
                </div>
                <ChevronRight />
              </div>

              {/* Key Details */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
                marginTop: 'var(--m-md)', paddingTop: 'var(--m-md)',
                borderTop: '1px solid var(--m-border-subtle)',
              }}>
                <span style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)' }}>
                  {load.distance}
                </span>
                <span style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)' }}>•</span>
                <span style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)' }}>
                  {load.escorts} escort{load.escorts > 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)' }}>•</span>
                <span style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-gold)' }}>
                  {load.pay}
                </span>
              </div>

              {/* Pickup Time */}
              <div style={{
                fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
                marginTop: 'var(--m-sm)',
              }}>
                Pickup: {load.pickup}
              </div>
            </div>
          </Link>
        ))}
      </MobileList>

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}
