/**
 * Corridor Signal Engine — Real-time corridor health detection
 * 
 * Detects hard-fill, hot-corridor, thin-corridor conditions from hc_corridor_signals table.
 * Used by corridor pages to display live market intelligence badges.
 */

import { supabaseServer } from '@/lib/supabase/server';

export interface CorridorSignals {
  corridor_slug: string;
  operator_count: number;
  claimed_operator_count: number;
  recent_activity_7d: number;
  recent_activity_30d: number;
  page_sessions_30d: number;
  claim_density: number;
  hard_fill: boolean;
  hot_corridor: boolean;
  thin_corridor: boolean;
  sponsor_eligible: boolean;
  sponsor_floor_usd: number;
  rate_change_pct: number;
}

// ─── Signal Thresholds ──────────────────────────────────────

const THRESHOLDS = {
  HARD_FILL_ACTIVITY_7D: 8,
  HARD_FILL_MAX_OPERATORS: 5,
  HOT_ACTIVITY_7D: 12,
  HOT_CLAIM_DENSITY: 0.20,
  THIN_MIN_OPERATORS: 3,
  THIN_MIN_CLAIMED: 1,
  SPONSOR_MIN_SESSIONS_30D: 400,
  SPONSOR_BASE_FLOOR_USD: 350,
  SPONSOR_HOT_MULTIPLIER: 1.25,
} as const;

// ─── Signal Computation ─────────────────────────────────────

export function computeSignals(raw: Partial<CorridorSignals>): CorridorSignals {
  const operators = raw.operator_count ?? 0;
  const claimed = raw.claimed_operator_count ?? 0;
  const activity7d = raw.recent_activity_7d ?? 0;
  const sessions30d = raw.page_sessions_30d ?? 0;
  const claimDensity = operators > 0 ? claimed / operators : 0;

  const hardFill = activity7d >= THRESHOLDS.HARD_FILL_ACTIVITY_7D && operators <= THRESHOLDS.HARD_FILL_MAX_OPERATORS;
  const hotCorridor = activity7d >= THRESHOLDS.HOT_ACTIVITY_7D && claimDensity >= THRESHOLDS.HOT_CLAIM_DENSITY;
  const thinCorridor = operators < THRESHOLDS.THIN_MIN_OPERATORS || claimed < THRESHOLDS.THIN_MIN_CLAIMED;
  const sponsorEligible = sessions30d >= THRESHOLDS.SPONSOR_MIN_SESSIONS_30D;

  let floorUsd = THRESHOLDS.SPONSOR_BASE_FLOOR_USD;
  if (hotCorridor) floorUsd *= THRESHOLDS.SPONSOR_HOT_MULTIPLIER;

  return {
    corridor_slug: raw.corridor_slug ?? '',
    operator_count: operators,
    claimed_operator_count: claimed,
    recent_activity_7d: activity7d,
    recent_activity_30d: raw.recent_activity_30d ?? 0,
    page_sessions_30d: sessions30d,
    claim_density: claimDensity,
    hard_fill: hardFill,
    hot_corridor: hotCorridor,
    thin_corridor: thinCorridor,
    sponsor_eligible: sponsorEligible,
    sponsor_floor_usd: floorUsd,
    rate_change_pct: raw.rate_change_pct ?? 0,
  };
}

// ─── Data Fetching ──────────────────────────────────────────

export async function getCorridorSignals(corridorSlug: string): Promise<CorridorSignals | null> {
  try {
    const sb = supabaseServer();
    const { data } = await sb
      .from('hc_corridor_signals')
      .select('*')
      .eq('corridor_slug', corridorSlug)
      .maybeSingle();

    if (!data) return null;
    return computeSignals(data as Partial<CorridorSignals>);
  } catch {
    return null;
  }
}

// ─── Badge Helpers ──────────────────────────────────────────

export function getSignalBadge(signals: CorridorSignals): { label: string; color: string; bg: string } | null {
  if (signals.hard_fill) return { label: '🔴 Hard Fill', color: 'var(--hc-danger)', bg: 'rgba(239, 68, 68, 0.12)' };
  if (signals.hot_corridor) return { label: '🔥 Hot Corridor', color: 'var(--hc-gold-400)', bg: 'rgba(198, 146, 58, 0.12)' };
  if (signals.thin_corridor) return { label: '⚠️ Coverage Needed', color: 'var(--hc-warning)', bg: 'rgba(245, 158, 11, 0.12)' };
  return null;
}
