'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ChooseYourLane, { getStoredRole, setStoredRole, type UserRole } from './ChooseYourLane';
import {
  MobileCard,
  MobileStatCard,
  MobileStatRow,
  MobileSectionHeader,
  MobileChip,
} from '@/components/mobile/MobileComponents';

/* ══════════════════════════════════════════════════════════════
   Mobile Command Center — Role-Aware Home
   P0-3: Transforms from generic home into role-shaped command center.
   
   Escort Operator: nearby work, urgent rescue, rank, compliance
   Broker/Dispatcher: post load, find coverage, hard fill, shortlist
   Both: role switcher + combined
   Other: marketplace entry + partner paths
   ══════════════════════════════════════════════════════════════ */

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

/* ── Role Label Map ── */
const ROLE_LABELS: Record<UserRole, string> = {
  escort_operator: '🚗 Escort Operator',
  broker_dispatcher: '📋 Broker / Dispatcher',
  both: '⚡ Dual Role',
  other: '🔧 Partner',
};

/* ── Escort Operator Home Modules ── */
function EscortHome() {
  return (
    <>
      {/* Quick Stats */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value="3" label="Nearby Jobs" dotColor="gold" />
          <MobileStatCard value="1" label="Urgent" dotColor="success" />
          <MobileStatCard value="#12" label="Your Rank" />
        </MobileStatRow>
      </div>

      {/* Urgent Rescue */}
      <MobileSectionHeader title="🔴 Urgent Rescue" action="View All" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <MobileCard variant="gold-border">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 800, color: '#EF4444' }}>
                Hard Fill — Houston → Dallas
              </div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                2 escorts needed · Departs in 3hrs · $1,850
              </div>
            </div>
            <Link href="/loads" className="m-btn m-btn--primary m-btn--small" style={{ textDecoration: 'none' }}>
              Respond
            </Link>
          </div>
        </MobileCard>
      </div>

      {/* Nearby Work */}
      <MobileSectionHeader title="Nearby Work" action="Map View" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {[
          { from: 'Houston, TX', to: 'San Antonio, TX', pay: '$450', dist: '197 mi', type: 'Oversize' },
          { from: 'Dallas, TX', to: 'Amarillo, TX', pay: '$620', dist: '360 mi', type: 'Wide Load' },
        ].map((job, i) => (
          <Link key={i} href="/loads" style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
            <MobileCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                    {job.from} → {job.to}
                  </div>
                  <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
                    {job.type} · {job.dist}
                  </div>
                </div>
                <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 900, color: 'var(--m-gold)' }}>
                  {job.pay}
                </div>
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>

      {/* Rank & Compliance */}
      <MobileSectionHeader title="Your Status" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <MobileCard>
          <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
            <div style={{ fontSize: 'var(--m-font-h1)', fontWeight: 900, color: 'var(--m-gold)' }}>92</div>
            <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>Trust Score</div>
          </div>
        </MobileCard>
        <Link href="/escort-requirements" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
              <div style={{ fontSize: 'var(--m-font-h1)', fontWeight: 900, color: '#22C55E' }}>✓</div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>Compliant</div>
            </div>
          </MobileCard>
        </Link>
      </div>
    </>
  );
}

/* ── Broker/Dispatcher Home Modules ── */
function BrokerHome() {
  return (
    <>
      {/* Quick Stats */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value="2" label="Open Loads" dotColor="gold" />
          <MobileStatCard value="5" label="Responses" dotColor="success" />
          <MobileStatCard value="89%" label="Fill Rate" dotColor="info" />
        </MobileStatRow>
      </div>

      {/* Quick Actions */}
      <MobileSectionHeader title="Quick Actions" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link href="/loads/post" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>📋</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-gold)' }}>Post a Load</div>
            </div>
          </MobileCard>
        </Link>
        <Link href="/directory" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>🔍</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Find Coverage</div>
            </div>
          </MobileCard>
        </Link>
      </div>

      {/* Hard Fill Rescue */}
      <MobileSectionHeader title="🔴 Hard Fill Rescue" action="Browse" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <MobileCard variant="gold-border">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 800, color: '#EF4444' }}>
                2 loads unfilled &gt;24hrs
              </div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                Boost these loads to get instant operator responses
              </div>
            </div>
            <Link href="/boost" className="m-btn m-btn--primary m-btn--small" style={{ textDecoration: 'none' }}>
              Boost
            </Link>
          </div>
        </MobileCard>
      </div>

      {/* Corridor Confidence */}
      <MobileSectionHeader title="Corridor Confidence" action="All Corridors" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {[
          { name: 'I-10 Houston→SA', demand: 'High', coverage: '8 operators', color: '#EF4444' },
          { name: 'I-35 Dallas→Austin', demand: 'Surge', coverage: '5 operators', color: 'var(--m-gold)' },
        ].map((c, i) => (
          <Link key={i} href="/escort/corridor" style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
            <MobileCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>{c.coverage}</div>
                </div>
                <MobileChip label={c.demand} variant={c.demand === 'Surge' ? 'gold' : 'warning'} />
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ── Market Pulse (shared) ── */
function MarketPulse() {
  return (
    <>
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

          {/* Sparkline */}
          <div style={{
            height: 40, marginTop: 'var(--m-md)',
            background: 'linear-gradient(90deg, rgba(212,168,68,0.05), rgba(212,168,68,0.15), rgba(212,168,68,0.05))',
            borderRadius: 'var(--m-radius-sm)',
            display: 'flex', alignItems: 'flex-end', gap: 3, padding: '0 4px 4px',
          }}>
            {[20, 35, 28, 42, 38, 50, 45, 55, 48, 60, 52, 65].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`,
                background: `rgba(212,168,68,${i >= 10 ? 0.7 : 0.25})`,
                borderRadius: 2,
              }} />
            ))}
          </div>
        </MobileCard>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function MobileCommandCenter() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredRole();
    setRole(stored);
    setLoading(false);
  }, []);

  // First-time user: show Choose Your Lane
  if (!loading && !role) {
    return (
      <ChooseYourLane
        onSelect={(selectedRole) => {
          setRole(selectedRole);
        }}
      />
    );
  }

  // Loading state
  if (loading) {
    return <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }} />;
  }

  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Greeting + Role Badge */}
      <div style={{ padding: 'var(--m-2xl) var(--m-screen-pad) var(--m-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', fontWeight: 500,
            }}>
              {getGreeting()} 👋
            </div>
            <h1 style={{
              fontSize: 'var(--m-font-display)', fontWeight: 800,
              color: 'var(--m-text-primary)', lineHeight: '32px', marginTop: 'var(--m-xs)',
            }}>
              Command Center
            </h1>
          </div>
          {/* Role badge — tap to switch */}
          <button
            onClick={() => {
              setRole(null);
              setStoredRole(null as unknown as UserRole);
              localStorage.removeItem('hc_user_role');
            }}
            style={{
              background: 'var(--m-surface-raised)',
              border: '1px solid var(--m-border-subtle)',
              borderRadius: 'var(--m-radius-full)',
              padding: '4px 12px',
              fontSize: 'var(--m-font-caption)',
              fontWeight: 700,
              color: 'var(--m-text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginTop: 'var(--m-xs)',
            }}
          >
            {ROLE_LABELS[role!]}
          </button>
        </div>
      </div>

      {/* Role-specific modules */}
      {role === 'escort_operator' && <EscortHome />}
      {role === 'broker_dispatcher' && <BrokerHome />}
      {role === 'both' && (
        <>
          <EscortHome />
          <div style={{ height: 'var(--m-lg)' }} />
          <BrokerHome />
        </>
      )}
      {role === 'other' && <EscortHome />}

      {/* Shared market intelligence */}
      <MarketPulse />

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}
