'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ChooseYourLane, { getStoredRole, setStoredRole, restoreRoleFromSupabase, type UserRole } from './ChooseYourLane';
import MobileMarketHeartbeat from '@/components/market/MobileMarketHeartbeat';
import {
  MobileCard,
  MobileStatCard,
  MobileStatRow,
  MobileSectionHeader,
  MobileChip,
} from '@/components/mobile/MobileComponents';
import {
  getAllCorridorSlugs,
  getCorridorData,
  type CorridorData,
} from '@/lib/data/corridors';
import { BrokerRescuePanel } from '@/components/broker/BrokerRescuePanel';
import { OutcomeProofBlock } from '@/components/market/OutcomeProofBlock';
import { DensityScoreboard } from '@/components/market/DensityScoreboard';
import { NearbyNowModule, SavedShortcutsModule } from '@/components/mobile/MobileFieldConsole';
import { OutcomeTimeline, BrokerOutcomeHistory } from '@/components/outcomes/OutcomeEngine';
import { MarketMomentumModule } from '@/components/market/DominanceSignals';
import { RecentWinsModule } from '@/components/outcomes/SocialProofLayer';
import { NearbySupportModule } from '@/components/infrastructure/RouteSupportEngine';
import { OutcomeAlertsFeed } from '@/components/outcomes/OutcomeAlerts';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Mobile Command Center â€” Role-Aware Home w/ Real Data
   P1: Wire to Supabase signals, truthful fallback, next best action.
   Lanes: escort, broker, both, support_partner, observer_researcher
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ Shared data hook â”€â”€ */
interface HomeSignals {
  openLoads: number | null;
  totalOperators: number | null;
  searchesThisWeek: number | null;
  topDemandStates: Array<{ state_code: string; demand_score: number; load_count: number }>;
  corridorPressure: Array<{
    name: string;
    slug: string;
    supplyPct: number;
    demandScore: number;
    operatorCount: number;
    surgeActive?: boolean;
    demandLevel?: string;
    avgRate?: number;
    supplyLevel?: string;
    demandPressure?: number;
  }>;
  loaded: boolean;
}

function useHomeSignals(): HomeSignals {
  const [signals, setSignals] = useState<HomeSignals>({
    openLoads: null,
    totalOperators: null,
    searchesThisWeek: null,
    topDemandStates: [],
    corridorPressure: [],
    loaded: false,
  });

  useEffect(() => {
    // 1. Local corridor data (always available, static)
    const corridors = getAllCorridorSlugs()
      .map(s => getCorridorData(s))
      .filter((c): c is CorridorData => c !== null)
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 5)
      .map(c => ({
        name: c.displayName,
        slug: c.slug,
        supplyPct: c.supplyPct,
        demandScore: c.demandScore,
        operatorCount: c.operatorCount,
      }));

    // 2. Fetch demand signals API (real Supabase data)
    async function fetchDemand() {
      try {
        const res = await fetch('/api/demand/signals?window=7d');
        if (!res.ok) return;
        const json = await res.json();
        const ds = json?.demand_signals;
        setSignals(prev => ({
          ...prev,
          openLoads: ds?.loads_in_window ?? prev.openLoads,
          searchesThisWeek: ds?.searches_in_window ?? prev.searchesThisWeek,
          topDemandStates: (ds?.top_demand_states ?? []).slice(0, 5),
          loaded: true,
        }));
      } catch {
        setSignals(prev => ({ ...prev, loaded: true }));
      }
    }

    setSignals(prev => ({ ...prev, corridorPressure: corridors }));
    fetchDemand();

    // 3. Fetch real directory count (6,949+ real operators)
    fetch('/api/directory/listings?limit=1')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.total) {
          setSignals(prev => ({ ...prev, totalOperators: data.total }));
        }
      })
      .catch(() => {});

    // 4. Fetch live corridor demand signals
    fetch('/api/v1/demand-intelligence/corridors?country_code=US')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.corridors?.length > 0) {
          const livePressure = data.corridors.slice(0, 5).map((c: any) => ({
            name: c.corridor_label,
            slug: c.corridor_id,
            supplyPct: 0,
            demandScore: c.demand_level === 'critical' ? 95 : c.demand_level === 'high' ? 82 : 60,
            operatorCount: c.avg_monthly_loads,
            demandLevel: c.demand_level,
            surgeActive: c.surge_active,
            avgRate: c.avg_rate_usd,
          }));
          setSignals(prev => ({
            ...prev,
            corridorPressure: livePressure.length > 0 ? livePressure : prev.corridorPressure,
          }));
        }
      })
      .catch(() => {});

    // 5. Fetch live supply and augment corridor pressure
    fetch('/api/supply/snapshot')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.corridors?.length > 0) {
          const supplyLookup: Record<string, any> = {};
          for (const c of data.corridors) supplyLookup[c.corridor_id] = c;
          setSignals(prev => ({
            ...prev,
            corridorPressure: prev.corridorPressure.map(cp => {
              const supply = supplyLookup[cp.slug];
              if (supply) {
                return {
                  ...cp,
                  supplyPct: supply.operator_count > 0
                    ? Math.round((supply.available_count / supply.operator_count) * 100)
                    : cp.supplyPct,
                  operatorCount: supply.operator_count || cp.operatorCount,
                  supplyLevel: supply.supply_level,
                  demandPressure: supply.demand_pressure,
                };
              }
              return cp;
            }),
          }));
        }
      })
      .catch(() => {});
  }, []);

  return signals;
}

/* â”€â”€ Utilities â”€â”€ */
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

/* â”€â”€ Role Label Map â”€â”€ */
const ROLE_LABELS: Record<UserRole, string> = {
  escort_operator: 'ðŸš— Escort Operator',
  broker_dispatcher: 'ðŸ“‹ Broker / Dispatcher',
  both: 'âš¡ Dual Role',
  support_partner: 'ðŸ— Support Partner',
  observer_researcher: 'ðŸ“Š Observer',
};

/* â”€â”€ Signal display helper â”€â”€ */
function signalValue(val: number | null, fallback: string): string {
  return val !== null ? String(val) : fallback;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ESCORT OPERATOR HOME
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function EscortHome({ signals }: { signals: HomeSignals }) {
  const topCorridor = signals.corridorPressure[0];

  return (
    <>
      {/* Stats â€” real where available */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value={signalValue(signals.openLoads, 'â€”')} label="Open Loads (7d)" dotColor="gold" />
          <MobileStatCard
            value={topCorridor ? `${100 - topCorridor.supplyPct}%` : 'â€”'}
            label="Top Shortage"
            dotColor="success"
          />
          <MobileStatCard value={signalValue(signals.searchesThisWeek, 'â€”')} label="Searches" dotColor="info" />
        </MobileStatRow>
      </div>

      {/* Live Market Heartbeat â€” real-time market truth */}
      <MobileMarketHeartbeat showRecentLoads={true} showCta={true} />

      {/* Hot corridor signal â€” real data */}
      {topCorridor && (
        <>
          <MobileSectionHeader title="ðŸ”´ Shortage Signal" action="All Corridors" />
          <div style={{ padding: '0 var(--m-screen-pad)' }}>
            <Link aria-label="Navigation Link" href={`/corridor/${topCorridor.slug}`} style={{ textDecoration: 'none' }}>
              <MobileCard variant="gold-border">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 800, color: '#EF4444' }}>
                      {topCorridor.name} â€” {100 - topCorridor.supplyPct}% shortage
                    </div>
                    <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                      Demand score {topCorridor.demandScore} · {topCorridor.operatorCount} operators on corridor
                    </div>
                  </div>
                  <ChevronRight />
                </div>
              </MobileCard>
            </Link>
          </div>
        </>
      )}

      {/* Outcome proof — why Haul Command wins */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <OutcomeProofBlock variant="strip" surface="home" />
      </div>

      {/* Nearby Now */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <NearbyNowModule />
      </div>

      {/* Next best action */}
      <MobileSectionHeader title="Next Steps" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/loads" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“‹</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-gold)' }}>Browse Loads</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/claim" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>âœ“</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Claim Profile</div>
            </div>
          </MobileCard>
        </Link>
      </div>

      {/* Recent Wins — real outcomes */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <OutcomeTimeline limit={5} title="Recent Wins" />
      </div>

      {/* Market Momentum */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MarketMomentumModule />
      </div>

      {/* Social proof */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <RecentWinsModule limit={3} />
      </div>

      {/* Route support nearby */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <NearbySupportModule limit={4} />
      </div>

      {/* Corridor pressure list */}
      <MobileSectionHeader title="Corridor Pressure" action="Radar" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {signals.corridorPressure.length > 1 ? (
          signals.corridorPressure.slice(1, 4).map((c) => (
            <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
              <MobileCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
                      {c.operatorCount} operators · Demand {c.demandScore}
                    </div>
                  </div>
                  <MobileChip label={c.supplyPct < 35 ? 'Shortage' : 'Tight'} variant={c.supplyPct < 35 ? 'warning' : 'gold'} />
                </div>
              </MobileCard>
            </Link>
          ))
        ) : !signals.loaded ? (
          <MobileCard>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '4px 0' }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
              <div>
                <div style={{ width: 120, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
                <div style={{ width: 80, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
              </div>
            </div>
          </MobileCard>
        ) : (
          <EmptyCorridorState message="Corridor data building. Browse the radar to explore active routes." />
        )}
      </div>
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   BROKER / DISPATCHER HOME
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function BrokerHome({ signals }: { signals: HomeSignals }) {
  return (
    <>
      {/* Stats â€” real */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value={signalValue(signals.openLoads, 'â€”')} label="Loads (7d)" dotColor="gold" />
          <MobileStatCard
            value={signals.topDemandStates[0] ? signals.topDemandStates[0].state_code : 'â€”'}
            label="Top Demand"
            dotColor="success"
          />
          <MobileStatCard value={signalValue(signals.searchesThisWeek, 'â€”')} label="Searches" dotColor="info" />
        </MobileStatRow>
      </div>

      {/* Live Market Heartbeat â€” brokers see supply truth */}
      <MobileMarketHeartbeat showRecentLoads={true} showCta={false} />

      {/* Rescue Actions — contextual rescue for at-risk loads */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <BrokerRescuePanel
          originState={signals.topDemandStates[0]?.state_code}
          destinationState={signals.topDemandStates[1]?.state_code}
          ageHours={6}
          variant="compact"
        />
      </div>

      {/* Quick Actions */}
      <MobileSectionHeader title="Quick Actions" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/loads/post" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“‹</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-gold)' }}>Post a Load</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/directory" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ”</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Find Coverage</div>
            </div>
          </MobileCard>
        </Link>
      </div>

      {/* Outcome proof — broker-specific */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <OutcomeProofBlock variant="comparison" surface="broker" />
      </div>

      {/* Market Density Board */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <DensityScoreboard variant="market" />
      </div>

      {/* Broker outcome history */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <BrokerOutcomeHistory limit={5} />
      </div>

      {/* Outcome alerts */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <OutcomeAlertsFeed limit={5} />
      </div>

      {/* Market Momentum */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MarketMomentumModule />
      </div>

      <MobileSectionHeader title="Coverage Confidence" action="All Corridors" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {signals.corridorPressure.slice(0, 3).map((c) => (
          <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
            <MobileCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>{c.operatorCount} operators</div>
                </div>
                <MobileChip
                  label={c.supplyPct < 35 ? 'Shortage' : c.supplyPct < 50 ? 'Tight' : 'OK'}
                  variant={c.supplyPct < 35 ? 'warning' : 'gold'}
                />
              </div>
            </MobileCard>
          </Link>
        ))}
      </div>

      {/* Demand hotspots â€” real */}
      {signals.topDemandStates.length > 0 && (
        <>
          <MobileSectionHeader title="Demand Hotspots" />
          <div style={{ padding: '0 var(--m-screen-pad)' }}>
            <MobileCard>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 8 }}>
                {signals.topDemandStates.slice(0, 5).map((s) => (
                  <div key={s.state_code} style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--m-gold)' }}>{s.state_code}</div>
                    <div style={{ fontSize: 10, color: 'var(--m-text-muted)', marginTop: 2 }}>{s.load_count} loads</div>
                  </div>
                ))}
              </div>
            </MobileCard>
          </div>
        </>
      )}
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SUPPORT PARTNER HOME â€” Revenue-Depth V2
   5 money paths: List/Claim â†’ Sponsor Territory â†’ Featured Partner
   â†’ Founding Market Partner â†’ Advertise
   + Demand context: corridors where partners are needed
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SupportPartnerHome({ signals }: { signals: HomeSignals }) {
  const totalOperators = signals.corridorPressure.reduce((sum, c) => sum + c.operatorCount, 0);
  const shortageCorridors = signals.corridorPressure.filter(c => c.supplyPct < 40);

  return (
    <>
      {/* Revenue opportunity stats */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value={totalOperators || '250+'} label="Operators" dotColor="gold" />
          <MobileStatCard value={shortageCorridors.length || 'â€”'} label="Shortage Zones" dotColor="success" />
          <MobileStatCard value={signalValue(signals.searchesThisWeek, 'â€”')} label="Searches/wk" dotColor="info" />
        </MobileStatRow>
      </div>

      {/* Primary CTA â€” Claim/List Your Services */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <Link aria-label="Navigation Link" href="/claim" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '18px 20px',
            borderRadius: 'var(--m-radius-lg, 16px)',
            background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(20,184,166,0.04))',
            border: '1px solid rgba(20,184,166,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 800, color: '#14B8A6' }}>
                List Your Services
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                {totalOperators ? `${totalOperators} operators search for support partners weekly` : 'Operators search for support partners daily'}
              </div>
            </div>
            <ChevronRight />
          </div>
        </Link>
      </div>

      {/* Revenue Actions â€” 5 paths */}
      <MobileSectionHeader title="Revenue Channels" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/sponsor" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ—</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: '#14B8A6' }}>Sponsor Territory</div>
              <div style={{ fontSize: 10, color: 'var(--m-text-muted)', marginTop: 4 }}>From $149/mo</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/advertise" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“£</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Advertise</div>
              <div style={{ fontSize: 10, color: 'var(--m-text-muted)', marginTop: 4 }}>Reach every operator</div>
            </div>
          </MobileCard>
        </Link>
      </div>

      {/* Premium upgrade opportunities */}
      <MobileSectionHeader title="Visibility Upgrades" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'flex', flexDirection: 'column', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/sponsor" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(212,168,68,0.08), rgba(212,168,68,0.02))',
            border: '1px solid rgba(212,168,68,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-gold, #D4A844)' }}>
                â­ Featured Partner
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                Priority listing + search boost · $99/mo
              </div>
            </div>
            <ChevronRight />
          </div>
        </Link>
        <Link aria-label="Navigation Link" href="/sponsor" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '16px 18px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
            border: '1px solid rgba(34,197,94,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: '#22C55E' }}>
                  ðŸ›¡ Founding Market Partner
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(34,197,94,0.15)', color: '#22C55E', textTransform: 'uppercase',
                }}>Limited</span>
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                Lock in founding rate + permanent badge
              </div>
            </div>
            <ChevronRight />
          </div>
        </Link>
      </div>

      {/* Where demand is highest â€” smart empty state */}
      <MobileSectionHeader title="Where Operators Need You" action="All Corridors" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {signals.corridorPressure.length > 0 ? (
          signals.corridorPressure.slice(0, 3).map((c) => (
            <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
              <MobileCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                      ðŸ›  {c.name}
                    </div>
                    <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                      {c.operatorCount} operators · {100 - c.supplyPct}% need more coverage
                    </div>
                  </div>
                  <ChevronRight />
                </div>
              </MobileCard>
            </Link>
          ))
        ) : (
          <EmptyCorridorState message="Corridor data loading. Browse all corridors to find demand." />
        )}
      </div>

      {/* Sponsored partner opportunity */}
      <SponsoredIntelligenceCell variant="partner" />
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OBSERVER / RESEARCHER HOME â€” Conversion-Depth V2
   5 conversion hooks (intelligence-first, not sales-first):
   1. Get Shortage Alerts â†’ claim/login
   2. Save Corridors â†’ login
   3. Compare Corridors â†’ /map
   4. Claim Profile â†’ /claim
   5. Sign In â†’ /login
   + Unlock Live Updates upsell
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ObserverHome({ signals }: { signals: HomeSignals }) {
  const criticalLanes = signals.corridorPressure.filter(c => c.supplyPct < 35).length;
  const avgSupply = signals.corridorPressure.length > 0
    ? Math.round(signals.corridorPressure.reduce((s, c) => s + c.supplyPct, 0) / signals.corridorPressure.length)
    : null;

  return (
    <>
      {/* Market overview â€” real data */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <MobileStatRow>
          <MobileStatCard value={criticalLanes || 'â€”'} label="Critical Lanes" dotColor="gold" />
          <MobileStatCard value={avgSupply !== null ? `${avgSupply}%` : 'â€”'} label="Avg Supply" dotColor="info" />
          <MobileStatCard value={signalValue(signals.openLoads, 'â€”')} label="Loads (7d)" dotColor="success" />
        </MobileStatRow>
      </div>

      {/* Conversion CTA â€” shortage alerts (intelligence-first) */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
        <div style={{
          padding: '18px 20px',
          borderRadius: 'var(--m-radius-lg, 16px)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.04))',
          border: '1px solid rgba(139,92,246,0.25)',
        }}>
          <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 800, color: '#8B5CF6' }}>
            Get shortage alerts for your corridors
          </div>
          <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            {criticalLanes > 0
              ? `${criticalLanes} corridors are in shortage right now. Sign in to track the ones that matter to you.`
              : 'Sign in to get notified when demand spikes on corridors you care about.'
            }
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link aria-label="Navigation Link" href="/claim" style={{
              padding: '8px 16px', borderRadius: 10,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              color: '#8B5CF6', fontSize: 'var(--m-font-body-sm)', fontWeight: 800,
              textDecoration: 'none',
            }}>
              Claim Profile
            </Link>
            <Link aria-label="Navigation Link" href="/login" style={{
              padding: '8px 16px', borderRadius: 10,
              background: 'transparent', border: '1px solid var(--m-border-subtle)',
              color: 'var(--m-text-secondary)', fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
              textDecoration: 'none',
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Intelligence Actions â€” observer-appropriate */}
      <MobileSectionHeader title="Intelligence Tools" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/map" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ—º</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: '#8B5CF6' }}>Corridor Radar</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/leaderboards" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ†</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Leaderboard</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/map" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“Š</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Compare Corridors</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/escort-requirements" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-sm) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“œ</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>State Rules</div>
            </div>
          </MobileCard>
        </Link>
      </div>

      {/* Corridor pressure index â€” smart empty state */}
      <MobileSectionHeader title="Corridor Pressure Index" action="Full Radar" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        {signals.corridorPressure.length > 0 ? (
          signals.corridorPressure.map((c) => (
            <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--m-sm)' }}>
              <MobileCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                      Supply {c.supplyPct}% · Demand {c.demandScore} · {c.operatorCount} operators
                    </div>
                  </div>
                  <div style={{ width: 48, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{
                      width: `${c.supplyPct}%`, height: '100%', borderRadius: 999,
                      background: c.supplyPct < 35 ? '#EF4444' : c.supplyPct < 50 ? 'var(--m-gold)' : '#22C55E',
                    }} />
                  </div>
                </div>
              </MobileCard>
            </Link>
          ))
        ) : (
          <EmptyCorridorState message="Corridor data loading. Open the radar to explore all corridors." />
        )}
      </div>

      {/* Unlock Live Updates â€” conversion hook (intelligence-first) */}
      <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/login" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>
                ðŸ”“ Unlock Live Updates
              </div>
              <div style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)', marginTop: 2 }}>
                Sign in to save corridors and get real-time supply alerts
              </div>
            </div>
            <ChevronRight />
          </div>
        </Link>
      </div>

      {/* Explore links */}
      <MobileSectionHeader title="Explore" />
      <div style={{ padding: '0 var(--m-screen-pad)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--m-sm)' }}>
        <Link aria-label="Navigation Link" href="/directory" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“–</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Directory</div>
            </div>
          </MobileCard>
        </Link>
        <Link aria-label="Navigation Link" href="/loads" style={{ textDecoration: 'none' }}>
          <MobileCard>
            <div style={{ textAlign: 'center', padding: 'var(--m-xs) 0' }}>
              <div style={{ fontSize: 22, marginBottom: 'var(--m-xs)' }}>ðŸ“‹</div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 800, color: 'var(--m-text-primary)' }}>Load Board</div>
            </div>
          </MobileCard>
        </Link>
      </div>
    </>
  );
}

/* â”€â”€ Shared smart empty state for corridor lists â”€â”€ */
function EmptyCorridorState({ message }: { message: string }) {
  return (
    <MobileCard>
      <div style={{ textAlign: 'center', padding: 'var(--m-md) var(--m-sm)' }}>
        <div style={{ fontSize: 28, marginBottom: 'var(--m-sm)' }}>ðŸ“¡</div>
        <div style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-text-secondary)', lineHeight: 1.4 }}>
          {message}
        </div>
        <Link aria-label="Navigation Link" href="/map" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 'var(--m-sm)', padding: '8px 14px', borderRadius: 10,
          background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.2)',
          color: 'var(--m-gold)', fontSize: 'var(--m-font-caption)', fontWeight: 800,
          textDecoration: 'none',
        }}>
          Open Radar
          <ChevronRight />
        </Link>
      </div>
    </MobileCard>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SPONSORED INTELLIGENCE CELL â€” Premium native monetization
   Rendered on home. Feels like product intelligence, not a banner ad.
   Fetches real paid inventory from /api/sponsor/inventory.
   Falls back to house intelligence when no paid inventory exists.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function SponsoredIntelligenceCell({ variant = 'default', topCorridor }: {
  variant?: 'default' | 'partner';
  topCorridor?: string;
}) {
  const [paidSponsor, setPaidSponsor] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Only check for paid inventory on consumer-facing variant
    if (variant === 'partner' || !topCorridor) return;
    fetch(`/api/sponsor/inventory?territory_type=corridor&territory_value=${encodeURIComponent(topCorridor)}`)
      .then(r => r.json())
      .then(data => {
        if (data.sponsor && !data.house) {
          setPaidSponsor({ name: data.sponsor.sponsor_name });
        }
      })
      .catch(() => { /* keep house ad */ });
  }, [variant, topCorridor]);

  const intelligence = paidSponsor
    ? {
        label: 'Sponsored Insight',
        headline: `${paidSponsor.name} â€” Verified Corridor Partner`,
        body: `${paidSponsor.name} provides specialized services on this corridor. Tap to learn more.`,
        ctaText: `View ${paidSponsor.name}`,
        ctaHref: '/directory',
        accentColor: 'var(--hc-gold-400, #D4A844)',
      }
    : variant === 'partner'
    ? {
        label: 'Partner Opportunity',
        headline: 'Sponsor a corridor and reach every operator on the route',
        body: 'Territory sponsors get featured placement in corridor intelligence, radar cards, and operator search results.',
        ctaText: 'See Sponsorship Plans',
        ctaHref: '/sponsor',
        accentColor: '#14B8A6',
      }
    : {
        label: 'Sponsored Insight',
        headline: 'Coverage gap: escort shortage growing on I-10 Gulf Coast',
        body: 'Operators listing on this corridor see 3x more job requests. Claim your profile to get noticed by brokers.',
        ctaText: 'Claim Your Profile',
        ctaHref: '/claim',
        accentColor: 'var(--hc-gold-400, #D4A844)',
      };

  return (
    <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
      <div style={{
        borderRadius: 'var(--m-radius-lg, 18px)',
        border: `1px solid ${intelligence.accentColor}25`,
        background: `linear-gradient(135deg, ${intelligence.accentColor}08, transparent)`,
        padding: 'var(--m-lg, 20px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Sponsored label */}
        <div style={{
          fontSize: 9,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: intelligence.accentColor,
          opacity: 0.7,
          marginBottom: 10,
        }}>
          {intelligence.label}
        </div>

        <div style={{
          fontSize: 'var(--m-font-body, 15px)',
          fontWeight: 800,
          color: 'var(--m-text-primary, #f5f7fb)',
          lineHeight: 1.3,
          marginBottom: 8,
        }}>
          {intelligence.headline}
        </div>

        <div style={{
          fontSize: 'var(--m-font-body-sm, 13px)',
          color: 'var(--m-text-secondary, #c7ccd7)',
          lineHeight: 1.5,
          marginBottom: 16,
        }}>
          {intelligence.body}
        </div>

        <Link aria-label="Navigation Link"
          href={intelligence.ctaHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 'var(--m-radius-md, 12px)',
            background: `${intelligence.accentColor}18`,
            border: `1px solid ${intelligence.accentColor}30`,
            color: intelligence.accentColor,
            fontSize: 'var(--m-font-body-sm, 13px)',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          {intelligence.ctaText}
          <ChevronRight />
        </Link>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MARKET PULSE â€” Shared across all lanes (real signal data)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function MarketPulse({ signals }: { signals: HomeSignals }) {
  return (
    <>
      <MobileSectionHeader title="Market Pulse" action="Details" />
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <MobileCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--m-font-body)', fontWeight: 700, color: 'var(--m-text-primary)' }}>
                {signals.openLoads !== null ? `${signals.openLoads} loads in past 7 days` : 'Market data loadingâ€¦'}
              </div>
              <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', marginTop: 2 }}>
                {signals.searchesThisWeek !== null
                  ? `${signals.searchesThisWeek} operator searches this week`
                  : 'Fetching search volumeâ€¦'}
              </div>
            </div>
            <TrendUpIcon />
          </div>

          {/* Corridor mini-bars â€” real data */}
          {signals.corridorPressure.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(signals.corridorPressure.length, 5)}, 1fr)`,
              gap: 6,
              marginTop: 'var(--m-md)',
              alignItems: 'end',
              height: 44,
            }}>
              {signals.corridorPressure.slice(0, 5).map((corridor) => {
                const barH = Math.max(8, (corridor.demandScore / 100) * 44);
                const surgeColor = corridor.surgeActive
                  ? 'var(--hc-gold-400)'
                  : corridor.demandScore >= 80
                  ? '#ef4444'
                  : corridor.demandScore >= 50
                  ? '#f59e0b'
                  : 'var(--m-text-muted)';
                return (
                  <div key={corridor.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: '100%', height: barH, borderRadius: 4,
                      background: surgeColor, opacity: 0.8, transition: 'height 0.3s ease',
                    }} />
                    <div style={{ fontSize: 8, color: 'var(--m-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {corridor.slug.replace('i-', '')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </MobileCard>
      </div>
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LIVE MARKET BAR â€” FIX 5: answers "is this alive?"
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function LiveMarketBar({ signals }: { signals: HomeSignals }) {
  return (
    <div style={{ padding: '0 var(--m-screen-pad)', marginBottom: 12 }}>
      <div style={{
        padding: '12px 16px', borderRadius: 16, minHeight: 72,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(34,197,94,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#22C55E',
            boxShadow: '0 0 8px rgba(34,197,94,0.5)',
            animation: 'pulse 2s infinite',
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>LIVE â€” US Market</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--m-text-muted)' }}>
              {signals.loaded ? 'Active now' : 'Loading...'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {signals.openLoads !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#22C55E' }}>{signals.openLoads}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--m-text-muted)' }}>loads</div>
            </div>
          )}
          {signals.totalOperators !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-gold, #D4A844)' }}>
                {signals.totalOperators?.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--m-text-muted)' }}>verified</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LIVE ACTIVITY PROOF â€” FIX 4: "Happening Right Now"
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function LiveActivityProof({ signals }: { signals: HomeSignals }) {
  if (!signals.loaded) return null;

  return (
    <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-md)' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--m-text-primary)', marginBottom: 4 }}>
        Happening Right Now
      </div>
      <div style={{ fontSize: 12, color: 'var(--m-text-muted)', marginBottom: 14 }}>
        Real market activity from live loads and verified operators.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {signals.corridorPressure.slice(0, 2).map(c => (
          <Link aria-label="Navigation Link" key={c.slug} href={`/corridor/${c.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary)' }}>ðŸ›£ {c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--m-text-muted)', marginTop: 2 }}>
                  {c.operatorCount} operators · Demand {c.demandScore}
                </div>
              </div>
              <MobileChip
                label={c.supplyPct < 35 ? 'Shortage' : c.supplyPct < 50 ? 'Tight' : 'Active'}
                variant={c.supplyPct < 35 ? 'warning' : 'gold'}
              />
            </div>
          </Link>
        ))}
        {signals.topDemandStates.length > 0 && (
          <div style={{
            padding: '14px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--m-text-secondary)', marginBottom: 8 }}>
              Demand Hotspots
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {signals.topDemandStates.slice(0, 4).map(s => (
                <div key={s.state_code} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--m-gold)' }}>{s.state_code}</div>
                  <div style={{ fontSize: 9, color: 'var(--m-text-muted)', marginTop: 2 }}>{s.load_count} loads</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WHY THIS WINS â€” FIX 4: outcome proof, replaces "Built for Both Sides"
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function WhyThisWins({ signals }: { signals: HomeSignals }) {
  const [side, setSide] = useState<'brokers' | 'operators'>('brokers');
  return (
    <div style={{ padding: '0 var(--m-screen-pad)', marginTop: 'var(--m-lg)' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--m-text-primary)', marginBottom: 12 }}>
        Why This Wins
      </div>
      <div style={{
        display: 'flex', borderRadius: 12, overflow: 'hidden',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 16, height: 40,
      }}>
        {(['brokers', 'operators'] as const).map(s => (
          <button aria-label="Interactive Button" key={s} onClick={() => setSide(s)} style={{
            flex: 1, border: 'none', cursor: 'pointer',
            background: side === s ? 'rgba(241,169,27,0.12)' : 'transparent',
            color: side === s ? '#F1A91B' : 'var(--m-text-muted)',
            fontSize: 13, fontWeight: 800, textTransform: 'capitalize',
            borderBottom: side === s ? '2px solid #F1A91B' : '2px solid transparent',
          }}>
            {s === 'brokers' ? 'ðŸ“‹ Brokers' : 'ðŸš— Operators'}
          </button>
        ))}
      </div>
      {side === 'brokers' ? (
        <div style={{ padding: '18px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
            Fill faster with live route-specific coverage
          </div>
          {['See active verified supply on the corridor', 'Post once and route to the right service type', 'Use rescue actions when a load starts going stale'].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ color: '#22C55E', fontWeight: 900 }}>â€º</span>
              <span style={{ fontSize: 13, color: 'var(--m-text-secondary)', lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22C55E' }}>
              {signals.openLoads ?? 'â€”'} Recent loads
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#3B82F6' }}>
              {signals.corridorPressure.length} Active corridors
            </span>
          </div>
          <Link aria-label="Navigation Link" href="/loads/post" style={{
            display: 'block', textAlign: 'center', marginTop: 16, padding: '12px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #F1A91B, #f1c27b)', color: '#000', fontWeight: 800, fontSize: 13, textDecoration: 'none',
          }}>
            Post a Load
          </Link>
        </div>
      ) : (
        <div style={{ padding: '18px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
            Get seen where the work is happening
          </div>
          {['Appear on live corridor and market surfaces', 'Claim your profile to control trust and visibility', 'Show services like Chase, High Pole, Route Survey'].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ color: '#F1A91B', fontWeight: 900 }}>â€º</span>
              <span style={{ fontSize: 13, color: 'var(--m-text-secondary)', lineHeight: 1.4 }}>{b}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: '#8B5CF6' }}>
              {signals.totalOperators?.toLocaleString() ?? 'â€”'} Profiles
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22C55E' }}>
              {signals.corridorPressure.length} Markets active
            </span>
          </div>
          <Link aria-label="Navigation Link" href="/claim" style={{
            display: 'block', textAlign: 'center', marginTop: 16, padding: '12px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #F1A91B, #f1c27b)', color: '#000', fontWeight: 800, fontSize: 13, textDecoration: 'none',
          }}>
            Claim Profile
          </Link>
        </div>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function MobileCommandCenter() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const signals = useHomeSignals();

  useEffect(() => {
    const stored = getStoredRole();
    setRole(stored);
    setLoading(false);
    restoreRoleFromSupabase().then(serverRole => {
      if (serverRole && serverRole !== stored) setRole(serverRole);
    });
  }, []);

  if (!loading && !role) {
    return <ChooseYourLane onSelect={(selectedRole) => setRole(selectedRole)} />;
  }
  if (loading) {
    return <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }} />;
  }

  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px var(--m-screen-pad) 0' }}>
        <Link aria-label="Navigation Link" href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--m-text-secondary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          <span style={{ fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-text-secondary)' }}>Home</span>
        </Link>
        <Link aria-label="Navigation Link" href="/login" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 999,
          background: 'var(--m-surface-raised)', border: '1px solid var(--m-border-subtle)', textDecoration: 'none',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--m-text-secondary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </Link>
      </div>

      {/* Greeting + Role */}
      <div style={{ padding: 'var(--m-md) var(--m-screen-pad) 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)', fontWeight: 500 }}>{getGreeting()} ðŸ‘‹</div>
            <h1 style={{ fontSize: 'var(--m-font-display)', fontWeight: 800, color: 'var(--m-text-primary)', lineHeight: '32px', marginTop: 'var(--m-xs)' }}>Command Center</h1>
          </div>
          <button aria-label="Interactive Button" onClick={() => { setRole(null); setStoredRole(null as unknown as UserRole); localStorage.removeItem('hc_user_role'); }} style={{
            background: 'var(--m-surface-raised)', border: '1px solid var(--m-border-subtle)', borderRadius: 'var(--m-radius-full)',
            padding: '4px 12px', fontSize: 'var(--m-font-caption)', fontWeight: 700, color: 'var(--m-text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap', marginTop: 'var(--m-xs)',
          }}>
            {ROLE_LABELS[role!]}
          </button>
        </div>
      </div>

      {/* â”â”â” LIVE MARKET BAR â”â”â” */}
      <LiveMarketBar signals={signals} />

      {/* â”â”â” PRIMARY ACTION STACK â”â”â” */}
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <Link aria-label="Navigation Link" href="/loads/post" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '18px 16px', borderRadius: 18, minHeight: 116,
              background: 'linear-gradient(145deg, rgba(241,169,27,0.12), rgba(241,169,27,0.04))',
              border: '1px solid rgba(241,169,27,0.25)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 22 }}>ðŸ“‹</div>
              <div><div style={{ fontSize: 15, fontWeight: 800, color: '#F1A91B' }}>Post a Load</div><div style={{ fontSize: 11, color: 'var(--m-text-secondary)', marginTop: 4 }}>Get matched with verified escorts.</div></div>
              <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(241,169,27,0.15)', textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#F1A91B' }}>
                {signals.openLoads ? `${signals.openLoads} active â€” Post Now` : 'Post Now'}
              </div>
            </div>
          </Link>
          <Link aria-label="Navigation Link" href="/directory" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '18px 16px', borderRadius: 18, minHeight: 116,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 22 }}>ðŸ”</div>
                {signals.totalOperators && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>{signals.totalOperators.toLocaleString()} VERIFIED</span>}
              </div>
              <div><div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 8 }}>Find an Escort</div><div style={{ fontSize: 11, color: 'var(--m-text-secondary)', marginTop: 4 }}>Search by route and service type.</div></div>
              <div style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>Search Now</div>
            </div>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[{ href: '/escort-requirements', emoji: 'ðŸ“œ', label: 'Requirements' }, { href: '/gear', emoji: 'ðŸªª', label: 'Compliance' }, { href: '/claim', emoji: 'âœ“', label: 'Claim Profile' }].map(a => (
            <Link aria-label="Navigation Link" key={a.href} href={a.href} style={{ padding: '10px 8px', borderRadius: 12, textDecoration: 'none', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{a.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--m-text-secondary)' }}>{a.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* â”â”â” GUIDED QUICKSTART FLOW â”â”â” */}
      <div style={{ padding: '0 var(--m-screen-pad)' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--m-text-primary)', marginBottom: 4 }}>Run This in 3 Steps</div>
        <div style={{ fontSize: 12, color: 'var(--m-text-muted)', marginBottom: 14 }}>Check the route. See the rules. Take action.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {[
            { step: 1, title: 'Do I Need an Escort?', body: 'Enter route and load details to see thresholds.', cta: 'Check Route', href: '/tools', color: '#F1A91B' },
            { step: 2, title: 'See Requirements', body: 'View rules, state thresholds, and compliance.', cta: 'View Rules', href: '/escort-requirements', color: '#22C55E' },
            { step: 3, title: 'Take Action', body: 'Post the load or connect with operators now.', cta: 'Continue', href: '/loads/post', color: '#3B82F6' },
          ].map(s => (
            <Link aria-label="Navigation Link" key={s.step} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: 16, borderRadius: 18, minHeight: 80, background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: '0 0 36px', width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, border: `1px solid ${s.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: s.color }}>{s.step}</div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>STEP {s.step}</span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--m-text-primary)', marginTop: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--m-text-secondary)', marginTop: 2 }}>{s.body}</div>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 8, background: `${s.color}12`, border: `1px solid ${s.color}25`, fontSize: 11, fontWeight: 800, color: s.color }}>{s.cta}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Role-specific modules */}
      {role === 'escort_operator' && <EscortHome signals={signals} />}
      {role === 'broker_dispatcher' && <BrokerHome signals={signals} />}
      {role === 'both' && <><EscortHome signals={signals} /><div style={{ height: 'var(--m-lg)' }} /><BrokerHome signals={signals} /></>}
      {role === 'support_partner' && <SupportPartnerHome signals={signals} />}
      {role === 'observer_researcher' && <ObserverHome signals={signals} />}

      {/* Sponsored intelligence — native premium unit */}
      {role !== 'support_partner' && <SponsoredIntelligenceCell topCorridor={signals.corridorPressure[0]?.slug} />}

      {/* Shared market intelligence */}
      <MarketPulse signals={signals} />

      {/* â”â”â” LIVE ACTIVITY PROOF â”â”â” */}
      <LiveActivityProof signals={signals} />

      {/* â”â”â” WHY THIS WINS â”â”â” */}
      <WhyThisWins signals={signals} />

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}

