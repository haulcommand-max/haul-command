'use client';

import React from 'react';
import Link from 'next/link';
import {
  MobileScreenHeader,
  MobileCard,
  MobileStatCard,
  MobileStatRow,
  MobileSectionHeader,
  MobileChip,
  MobileChipScroll,
} from '@/components/mobile/MobileComponents';

/* ══════════════════════════════════════════════════════════════
   Mobile Command Center — Frame 3
   Greeting, stats, routes carousel, market pulse, leaderboard peek
   Approved spec: 390px, dark, gold accents, no ads
   ══════════════════════════════════════════════════════════════ */

/* --- Mock data (replace with server data) --- */
const MOCK_ROUTES = [
  { id: 1, from: 'Houston, TX', to: 'Dallas, TX', distance: '240 mi' },
  { id: 2, from: 'San Antonio, TX', to: 'El Paso, TX', distance: '550 mi' },
  { id: 3, from: 'Oklahoma City', to: 'Tulsa, OK', distance: '106 mi' },
  { id: 4, from: 'Dallas, TX', to: 'Amarillo, TX', distance: '360 mi' },
];

const MOCK_LEADERS = [
  { rank: 1, name: 'Texas Wide Load', score: 97, location: 'Houston, TX', verified: true },
  { rank: 2, name: 'Lone Star Escorts', score: 94, location: 'Dallas, TX', verified: true },
  { rank: 3, name: 'Plains Pilot Cars', score: 91, location: 'OKC, OK', verified: false },
];

const RANK_COLORS: Record<number, string> = {
  1: '#D4A844',
  2: '#C0C0C0',
  3: '#CD7F32',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--m-gold)' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22C55E' }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export default function MobileCommandCenter() {
  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Greeting */}
      <div style={{ padding: 'var(--m-2xl) var(--m-screen-pad) var(--m-sm)' }}>
        <div style={{
          fontSize: 'var(--m-font-body-sm)',
          color: 'var(--m-text-secondary)',
          fontWeight: 500,
        }}>
          {getGreeting()} 👋
        </div>
        <h1 style={{
          fontSize: 'var(--m-font-display)',
          fontWeight: 800,
          color: 'var(--m-text-primary)',
          lineHeight: '32px',
          marginTop: 'var(--m-xs)',
        }}>
          Command Center
        </h1>
      </div>

      {/* Quick Stats Row */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value="2" label="Active Jobs" dotColor="success" />
          <MobileStatCard value="5" label="Pending" dotColor="gold" />
          <MobileStatCard value="3" label="Messages" dotColor="info" />
        </MobileStatRow>
      </div>

      {/* Your Routes Carousel */}
      <MobileSectionHeader title="Your Routes" action="View All" />
      <div className="m-carousel">
        {MOCK_ROUTES.map(route => (
          <div key={route.id} className="m-carousel__item" style={{ width: 180 }}>
            <MobileCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-xs)', marginBottom: 'var(--m-sm)' }}>
                <ChevronRight />
                <span style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-gold)', fontWeight: 600 }}>
                  {route.distance}
                </span>
              </div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 600, color: 'var(--m-text-primary)', lineHeight: '18px' }}>
                {route.from}
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                → {route.to}
              </div>
            </MobileCard>
          </div>
        ))}
      </div>

      {/* Market Pulse */}
      <MobileSectionHeader title="Market Pulse" action="Details" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <MobileCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                12 new loads in TX
              </div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                Demand up 15% this week
              </div>
            </div>
            <TrendUpIcon />
          </div>

          {/* Sparkline placeholder */}
          <div style={{
            height: 40,
            marginTop: 'var(--m-md)',
            background: 'linear-gradient(90deg, rgba(212,168,68,0.05), rgba(212,168,68,0.15), rgba(212,168,68,0.05))',
            borderRadius: 'var(--m-radius-sm)',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 3,
            padding: '0 4px 4px',
          }}>
            {[20, 35, 28, 42, 38, 50, 45, 55, 48, 60, 52, 65].map((h, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${h}%`,
                background: `rgba(212,168,68,${i >= 10 ? 0.7 : 0.25})`,
                borderRadius: 2,
              }} />
            ))}
          </div>
        </MobileCard>
      </div>

      {/* Leaderboard Peek */}
      <MobileSectionHeader title="Leaderboard" action="Full Rankings" />
      <div style={{ padding: '0 var(--m-screen-pad)', paddingBottom: 'var(--m-3xl)' }}>
        {MOCK_LEADERS.map(leader => (
          <Link
            key={leader.rank}
            href="/leaderboards"
            style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}
          >
            <MobileCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-md)' }}>
                {/* Rank Badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: 'var(--m-radius-sm)',
                  background: `${RANK_COLORS[leader.rank]}15`,
                  border: `1px solid ${RANK_COLORS[leader.rank]}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--m-font-body)', fontWeight: 800,
                  color: RANK_COLORS[leader.rank],
                }}>
                  #{leader.rank}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--m-font-body)', fontWeight: 600,
                    color: 'var(--m-text-primary)',
                    display: 'flex', alignItems: 'center', gap: 'var(--m-xs)',
                  }}>
                    {leader.name}
                    {leader.verified && (
                      <span style={{
                        fontSize: 9, color: '#22C55E', background: 'rgba(34,197,94,0.1)',
                        padding: '1px 5px', borderRadius: 4, fontWeight: 700,
                      }}>✓</span>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
                    {leader.location}
                  </div>
                </div>

                {/* Trust Score */}
                <div style={{
                  fontSize: 'var(--m-font-h2)', fontWeight: 800,
                  color: RANK_COLORS[leader.rank] || 'var(--m-text-primary)',
                }}>
                  {leader.score}
                </div>
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
