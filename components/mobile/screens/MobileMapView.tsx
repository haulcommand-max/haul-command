'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  MobileButton,
  MobileCard,
  MobileChip,
  MobileChipScroll,
  MobileList,
  MobileScreenHeader,
  MobileStatCard,
  MobileStatRow,
} from '@/components/mobile/MobileComponents';
import { estimateLiquidityScore } from '@/components/intelligence/LiquidityBadge';
import {
  estimateEscortCost,
  getAllCorridorSlugs,
  getCorridorData,
  type CorridorData,
} from '@/lib/data/corridors';

type SortKey = 'pressure' | 'demand' | 'supply' | 'distance';

/* ── Live signal types ── */
interface LiveDemand {
  corridor_id: string;
  corridor_label: string;
  demand_level: string;
  avg_monthly_loads: number;
  avg_rate_usd: number;
  surge_active: boolean;
  surge_multiplier: number;
}
interface LiveSupply {
  corridor_slug: string;
  supply_count: number;
  available_count: number;
  demand_pressure: number;
}

interface CorridorSignal {
  corridor: CorridorData;
  shortagePct: number;
  maxEscortsRequired: number;
  liquidityScore: number;
  estimatedSpend: { low: number; high: number };
  routeFriction: number[];
  pressureIndex: number;
  actionHint: { label: string; color: string };
  livedemand: LiveDemand | null;
  livesupply: LiveSupply | null;
  sponsorAvailable: boolean;
  status: {
    key: 'critical' | 'tight' | 'watch';
    label: string;
    color: string;
    background: string;
    border: string;
  };
}

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'pressure', label: 'Pressure' },
  { key: 'demand', label: 'Demand' },
  { key: 'supply', label: 'Supply' },
  { key: 'distance', label: 'Miles' },
];

function parseEscortRequirement(value: string) {
  if (value.includes('2')) return 2;
  if (value.includes('1 Front + 1 Rear')) return 2;
  if (value.includes('Front') || value.includes('Rear')) return 1;
  return 1;
}

function buildRouteFriction(corridor: CorridorData) {
  return corridor.stateRequirements.map((requirement) => {
    const nightSignal =
      requirement.nightMovement === 'prohibited'
        ? 24
        : requirement.nightMovement === 'restricted'
          ? 14
          : 4;
    const widthSignal = Math.max(0, 16 - requirement.widthTriggerFt) * 7;
    const policeSignal = Math.max(0, 18 - requirement.policeTriggerWidthFt) * 5;
    return Math.max(24, Math.min(100, 22 + nightSignal + widthSignal + policeSignal));
  });
}

function getStatus(corridor: CorridorData, shortagePct: number): CorridorSignal['status'] {
  if (shortagePct >= 65 || corridor.demandScore >= 88) {
    return {
      key: 'critical',
      label: 'Critical shortage',
      color: '#fca5a5',
      background: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.24)',
    };
  }

  if (shortagePct >= 50 || corridor.demandScore >= 78) {
    return {
      key: 'tight',
      label: 'Tight coverage',
      color: '#f1c27b',
      background: 'rgba(198, 146, 58, 0.12)',
      border: 'rgba(198, 146, 58, 0.24)',
    };
  }

  return {
    key: 'watch',
    label: 'Watch list',
    color: '#86efac',
    background: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.22)',
  };
}

function formatMoneyCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: value >= 1000 ? 'compact' : 'standard',
  }).format(value);
}

/* ── Pressure Index & Action Hints ── */
function computePressureIndex(demandPressure: number, demandLevel: string, surgeActive: boolean): number {
  if (surgeActive) return Math.min(1.5, demandPressure + 0.4);
  const levelBoost = demandLevel === 'critical' ? 0.3 : demandLevel === 'high' ? 0.15 : 0;
  return Math.min(1.5, demandPressure + levelBoost);
}

function getActionHint(pressureIndex: number, surgeActive: boolean, supplyLevel: string): { label: string; color: string } {
  if (surgeActive) return { label: '⚡ Active surge pricing', color: '#f97316' };
  if (pressureIndex >= 0.8) return { label: '🔥 High opportunity', color: '#ef4444' };
  if (pressureIndex >= 0.5) return { label: '📊 Watch market', color: '#f59e0b' };
  if (pressureIndex >= 0.3) return { label: '⚖️ Competitive lane', color: '#6b7280' };
  return { label: '✅ Adequate supply', color: '#22c55e' };
}

/* ── Live data hook: demand + supply from APIs, static as fallback ── */
function useLiveSignals() {
  const [demandMap, setDemandMap] = useState<Record<string, LiveDemand>>({});
  const [supplyMap, setSupplyMap] = useState<Record<string, LiveSupply>>({});
  const [sponsorMap, setSponsorMap] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      // 1. Demand signals (live from corridor_demand_signals)
      try {
        const res = await fetch('/api/v1/demand-intelligence/corridors?country_code=US');
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, LiveDemand> = {};
          for (const c of (data.corridors ?? [])) map[c.corridor_id] = c;
          setDemandMap(map);
        }
      } catch {}

      // 2. Supply snapshots (live from corridor_supply_snapshot)
      try {
        const res = await fetch('/api/supply/snapshot');
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, LiveSupply> = {};
          for (const c of (data.corridors ?? [])) {
            map[c.corridor_id] = {
              corridor_slug: c.corridor_id,
              supply_count: c.operator_count,
              available_count: c.available_count,
              demand_pressure: c.demand_pressure,
            };
          }
          setSupplyMap(map);
        }
      } catch {}

      // 3. Sponsor availability for top corridors
      const corridorSlugs = ['i-10', 'i-20', 'i-40', 'i-95', 'i-35', 'i-75-southeast'];
      const sponsorState: Record<string, boolean> = {};
      try {
        const checks = await Promise.allSettled(
          corridorSlugs.map(slug =>
            fetch(`/api/sponsor/inventory?territory_type=corridor&territory_value=${slug}`)
              .then(r => r.ok ? r.json() : null)
          )
        );
        checks.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            sponsorState[corridorSlugs[i]] = result.value.founding_available === true;
          }
        });
        setSponsorMap(sponsorState);
      } catch {}

      setLoaded(true);
    }
    fetchAll();
  }, []);

  return { demandMap, supplyMap, sponsorMap, loaded };
}

function corridorSignals(demandMap: Record<string, LiveDemand>, supplyMap: Record<string, LiveSupply>, sponsorMap: Record<string, boolean>): CorridorSignal[] {
  return getAllCorridorSlugs()
    .map((slug) => getCorridorData(slug))
    .filter((corridor): corridor is CorridorData => corridor !== null)
    .map((corridor) => {
      const maxEscortsRequired = Math.max(
        ...corridor.stateRequirements.map((requirement) =>
          parseEscortRequirement(requirement.escortsRequired),
        ),
      );

      const live = demandMap[corridor.slug] ?? null;
      const liveSupply = supplyMap[corridor.slug] ?? null;

      // Use live data when available, fall back to static
      const demandScore = live ? (live.demand_level === 'critical' ? 95 : live.demand_level === 'high' ? 82 : live.demand_level === 'moderate' ? 60 : 40) : corridor.demandScore;
      const supplyPct = liveSupply ? Math.round((liveSupply.available_count / Math.max(liveSupply.supply_count, 1)) * 100) : corridor.supplyPct;
      const surgeActive = live?.surge_active ?? corridor.hot;

      const shortagePct = 100 - supplyPct;
      const liquidityScore = estimateLiquidityScore(supplyPct, demandScore);
      const estimatedSpend = estimateEscortCost(
        corridor.totalMiles,
        maxEscortsRequired,
        surgeActive ? 'priority' : 'standard',
      );

      const rawPressure = liveSupply?.demand_pressure ?? (shortagePct / 100);
      const pressureIndex = computePressureIndex(rawPressure, live?.demand_level ?? '', surgeActive);
      const supplyLevel = pressureIndex >= 0.8 ? 'shortage' : pressureIndex >= 0.4 ? 'tight' : 'adequate';
      const actionHint = getActionHint(pressureIndex, surgeActive, supplyLevel);

      return {
        corridor: { ...corridor, demandScore, supplyPct, hot: surgeActive },
        shortagePct,
        maxEscortsRequired,
        liquidityScore,
        estimatedSpend,
        routeFriction: buildRouteFriction(corridor),
        pressureIndex,
        actionHint,
        livedemand: live,
        livesupply: liveSupply,
        sponsorAvailable: sponsorMap[corridor.slug] ?? true,
        status: getStatus({ ...corridor, demandScore, supplyPct, hot: surgeActive }, shortagePct),
      };
    });
}

function sortSignals(signals: CorridorSignal[], sortBy: SortKey) {
  const items = [...signals];

  items.sort((left, right) => {
    if (sortBy === 'demand') return right.corridor.demandScore - left.corridor.demandScore;
    if (sortBy === 'supply') return left.corridor.supplyPct - right.corridor.supplyPct;
    if (sortBy === 'distance') return right.corridor.totalMiles - left.corridor.totalMiles;
    return right.shortagePct - left.shortagePct;
  });

  return items;
}

function RadarHero({ signal }: { signal: CorridorSignal }) {
  return (
    <MobileCard variant="gold-border">
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(198, 146, 58, 0.12)',
          color: 'var(--hc-gold-400)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Corridor radar
      </div>

      <h2
        style={{
          margin: '14px 0 10px',
          fontSize: 28,
          lineHeight: 1,
          fontWeight: 900,
          color: 'var(--m-text-primary, #f5f7fb)',
        }}
      >
        Ranked corridor intelligence for mobile dispatch.
      </h2>

      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.65,
          color: 'var(--m-text-secondary, #c7ccd7)',
        }}
      >
        The radar now prioritizes live corridor pressure, route friction, and escort coverage instead
        of decorative map pins. Tap any lane below to expand the operating detail.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 18,
          border: `1px solid ${signal.status.border}`,
          background: signal.status.background,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: signal.status.color,
              }}
            >
              Lead signal
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                lineHeight: 1.1,
                fontWeight: 900,
                color: 'var(--m-text-primary, #f5f7fb)',
              }}
            >
              {signal.corridor.displayName}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                lineHeight: 1.55,
                color: 'var(--m-text-secondary, #c7ccd7)',
              }}
            >
              {signal.corridor.endpoints}
            </div>
          </div>

          <div
            style={{
              padding: '7px 10px',
              borderRadius: 999,
              border: `1px solid ${signal.status.border}`,
              background: 'rgba(6, 11, 18, 0.32)',
              color: signal.status.color,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            {signal.status.label}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            marginTop: 14,
          }}
        >
          <SignalStat label="Shortage" value={`${signal.shortagePct}%`} />
          <SignalStat label="Demand" value={String(signal.corridor.demandScore)} />
          <SignalStat label="Escorts" value={String(signal.corridor.operatorCount)} />
        </div>
      </div>
    </MobileCard>
  );
}

function SignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--m-text-muted, #8f97a7)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 18,
          fontWeight: 900,
          color: 'var(--m-text-primary, #f5f7fb)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function CorridorSignalCard({
  signal,
  expanded,
  onToggle,
}: {
  signal: CorridorSignal;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <MobileCard
      onClick={onToggle}
      className={expanded ? 'm-card--gold-border' : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px',
                borderRadius: 999,
                background: signal.status.background,
                color: signal.status.color,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {signal.status.label}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${signal.actionHint.color}33`,
                color: signal.actionHint.color,
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {signal.actionHint.label}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 20,
              lineHeight: 1.1,
              fontWeight: 900,
              color: 'var(--m-text-primary, #f5f7fb)',
            }}
          >
            {signal.corridor.displayName}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              lineHeight: 1.55,
              color: 'var(--m-text-secondary, #c7ccd7)',
            }}
          >
            {signal.corridor.endpoints}
          </div>
        </div>

        <div
          style={{
            minWidth: 64,
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--m-text-muted, #8f97a7)',
            }}
          >
            Supply
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 24,
              fontWeight: 900,
              color: 'var(--m-text-primary, #f5f7fb)',
            }}
          >
            {signal.corridor.supplyPct}%
          </div>
          {/* Pressure index mini-bar */}
          <div style={{ marginTop: 6, width: '100%', height: 3, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)' }}>
            <div style={{
              width: `${Math.min(100, Math.round(signal.pressureIndex * 70))}%`,
              height: '100%',
              borderRadius: 999,
              background: signal.pressureIndex >= 0.8 ? '#ef4444' : signal.pressureIndex >= 0.5 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--m-text-muted, #8f97a7)',
            }}
          >
            Route friction
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--m-text-muted, #8f97a7)',
            }}
          >
            {signal.corridor.primaryStates.join(' / ')}
          </div>
        </div>

        <RouteFrictionStrip values={signal.routeFriction} />
        <StateTrack states={signal.corridor.primaryStates} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          marginTop: 16,
        }}
      >
        <MetricCard label="Demand" value={signal.livedemand ? signal.livedemand.demand_level.toUpperCase() : String(signal.corridor.demandScore)} />
        <MetricCard
          label="Est. escort spend"
          value={`${formatMoneyCompact(signal.estimatedSpend.low)}-${formatMoneyCompact(signal.estimatedSpend.high)}`}
        />
        <MetricCard label="Pressure" value={signal.pressureIndex.toFixed(2)} />
        <MetricCard label={signal.livedemand ? 'Avg rate' : 'Escorts'} value={signal.livedemand ? `$${signal.livedemand.avg_rate_usd.toLocaleString()}` : `${signal.corridor.operatorCount}`} />
      </div>

      {/* Surge banner */}
      {signal.livedemand?.surge_active && (
        <div style={{
          marginTop: 10,
          padding: '8px 12px',
          borderRadius: 12,
          background: 'rgba(249, 115, 22, 0.12)',
          border: '1px solid rgba(249, 115, 22, 0.24)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          fontWeight: 800,
          color: '#f97316',
        }}>
          ⚡ Surge active · {signal.livedemand.surge_multiplier}x multiplier · {signal.livedemand.avg_monthly_loads} loads/mo
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <ExpandedNote title="Broker note" body={signal.corridor.brokerIntelNote} />
          <ExpandedNote title="Escort note" body={signal.corridor.escortIntelNote} />

          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--m-text-muted, #8f97a7)',
              }}
            >
              Top route constraints
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              {signal.corridor.keyRegulations.slice(0, 3).map((item) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--m-text-secondary, #c7ccd7)',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <ActionLink href={`/corridor/${signal.corridor.slug}`} variant="primary">
              Open corridor intelligence
            </ActionLink>
            <ActionLink href="/loads/post" variant="secondary">
              Post a load into this lane
            </ActionLink>
            {signal.sponsorAvailable && (
              <ActionLink href={`/sponsor/checkout?territory=corridor&value=${signal.corridor.slug}`} variant="secondary">
                🌟 Own this corridor · From $149/mo
              </ActionLink>
            )}
          </div>
        </div>
      )}
    </MobileCard>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--m-text-muted, #8f97a7)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 15,
          lineHeight: 1.4,
          fontWeight: 800,
          color: 'var(--m-text-primary, #f5f7fb)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ExpandedNote({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--hc-gold-400)',
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          lineHeight: 1.65,
          color: 'var(--m-text-secondary, #c7ccd7)',
        }}
      >
        {body}
      </div>
    </div>
  );
}

function RouteFrictionStrip({ values }: { values: number[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
        alignItems: 'end',
        gap: 6,
        minHeight: 44,
      }}
    >
      {values.map((value, index) => (
        <div
          key={`${index}-${value}`}
          style={{
            height: `${Math.max(16, Math.round((value / 100) * 42))}px`,
            borderRadius: 999,
            background:
              value >= 80
                ? 'linear-gradient(180deg, #f97316 0%, #ef4444 100%)'
                : value >= 60
                  ? 'linear-gradient(180deg, #f1a91b 0%, #f97316 100%)'
                  : 'linear-gradient(180deg, rgba(198, 146, 58, 0.4) 0%, rgba(198, 146, 58, 0.9) 100%)',
          }}
        />
      ))}
    </div>
  );
}

function StateTrack({ states }: { states: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, overflowX: 'auto' }}>
      {states.map((state, index) => (
        <div key={state} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              minWidth: 34,
              padding: '6px 8px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--m-text-primary, #f5f7fb)',
            }}
          >
            {state}
          </div>
          {index < states.length - 1 && (
            <div
              style={{
                width: 10,
                height: 2,
                borderRadius: 999,
                background: 'rgba(198, 146, 58, 0.6)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ActionLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: 'primary' | 'secondary';
  children: string;
}) {
  const styles =
    variant === 'primary'
      ? {
          background: 'linear-gradient(135deg, var(--hc-gold-400), #f1c27b)',
          color: '#060b12',
          border: '1px solid rgba(198, 146, 58, 0.4)',
        }
      : {
          background: 'rgba(255, 255, 255, 0.03)',
          color: 'var(--m-text-primary, #f5f7fb)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        };

  return (
    <Link aria-label="Navigation Link"
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        padding: '0 16px',
        borderRadius: 16,
        textDecoration: 'none',
        fontSize: 14,
        fontWeight: 800,
        ...styles,
      }}
    >
      {children}
    </Link>
  );
}

export default function MobileMapView() {
  const [sortBy, setSortBy] = useState<SortKey>('pressure');
  const { demandMap, supplyMap, sponsorMap } = useLiveSignals();
  const signals = useMemo(() => corridorSignals(demandMap, supplyMap, sponsorMap), [demandMap, supplyMap, sponsorMap]);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(signals[0]?.corridor.slug ?? null);

  const sortedSignals = useMemo(() => sortSignals(signals, sortBy), [signals, sortBy]);
  const leadSignal = sortedSignals[0];
  const surgeCount = signals.filter((s) => s.livedemand?.surge_active).length;
  const criticalCount = signals.filter((signal) => signal.status.key === 'critical').length;
  const averageSupply = Math.round(
    signals.reduce((total, signal) => total + signal.corridor.supplyPct, 0) / Math.max(signals.length, 1),
  );
  const liveSource = Object.keys(demandMap).length > 0;

  return (
    <div
      className="m-shell-content"
      style={{
        minHeight: '100dvh',
        background:
          'radial-gradient(circle at top left, rgba(198, 146, 58, 0.14), transparent 34%), var(--m-bg, #060b12)',
      }}
    >
      <MobileScreenHeader
        title="Radar"
        rightAction={
          <Link aria-label="Navigation Link"
            href="/corridor"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
              padding: '0 12px',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--m-text-primary, #f5f7fb)',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            All corridors
          </Link>
        }
      />

      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '16px var(--m-screen-pad, 16px) calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + 28px)',
        }}
      >
        {leadSignal && <RadarHero signal={leadSignal} />}

        {/* Live source indicator */}
        {liveSource && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Live signals · {Object.keys(demandMap).length} corridors
            </span>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <MobileStatRow>
            <MobileStatCard value={criticalCount} label="critical lanes" dotColor="gold" />
            <MobileStatCard value={surgeCount > 0 ? `${surgeCount} surge` : `${averageSupply}%`} label={surgeCount > 0 ? 'active surges' : 'avg supply'} dotColor={surgeCount > 0 ? 'gold' : 'info'} />
            <MobileStatCard value={signals.length} label="tracked corridors" dotColor="success" />
          </MobileStatRow>
        </div>

        <div style={{ marginTop: 16 }}>
          <MobileChipScroll>
            {SORT_OPTIONS.map((option) => (
              <MobileChip
                key={option.key}
                label={option.label}
                active={sortBy === option.key}
                variant={sortBy === option.key ? 'gold' : 'filter'}
                onClick={() => setSortBy(option.key)}
              />
            ))}
          </MobileChipScroll>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          }}
        >
          <MobileButton variant="secondary" onClick={() => setExpandedSlug(sortedSignals[0]?.corridor.slug ?? null)}>
            Focus hottest lane
          </MobileButton>
          <ActionLink href="/loads/post" variant="primary">
            Post a load
          </ActionLink>
        </div>

        <div style={{ marginTop: 18 }}>
          <MobileList>
            {sortedSignals.map((signal) => (
              <CorridorSignalCard
                key={signal.corridor.slug}
                signal={signal}
                expanded={expandedSlug === signal.corridor.slug}
                onToggle={() =>
                  setExpandedSlug((current) =>
                    current === signal.corridor.slug ? null : signal.corridor.slug,
                  )
                }
              />
            ))}
          </MobileList>
        </div>
      </div>
    </div>
  );
}
