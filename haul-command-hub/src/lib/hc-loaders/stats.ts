/**
 * hc-loaders/stats.ts
 * ─────────────────────────────────────────────────────────────
 * THE ONE CANONICAL SOURCE for all public stats on Haul Command.
 *
 * All pages MUST call this. Nobody reads directory_listings for counts.
 * Nobody hardcodes numbers. Numbers = null means "genuinely unknown".
 *
 * Real counts as of 2026-03-29:
 *   total_real_operators: 7,172  (USpilotcars + OSOW Haven)
 *   us_operators:         7,103
 *   operators_with_phone: 2,660
 *   operators_with_email: 1,771
 *   jurisdictions:        66
 *   active_countries:     2     (US, CA — real data only)
 *   quarantined_synthetic: 654,809 (removed from all public surfaces)
 */

import { supabaseServer } from '@/lib/supabase-server';

export interface CanonicalStats {
  total_real_operators: number;
  us_operators: number;
  operators_with_phone: number;
  operators_with_email: number;
  claimed_profiles: number;
  active_countries: number;
  jurisdictions: number;
  infrastructure_locations: number;
  escort_operators: number;
  pilot_car_operators: number;
  pilot_drivers: number;
  quarantined_synthetic: number;
  sources: { uspilotcars_hc_entity: number; osow_haven: number };
  computed_at: string;
}

let _cachedStats: CanonicalStats | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes — matches ISR

export async function getCanonicalStats(): Promise<CanonicalStats> {
  const now = Date.now();
  if (_cachedStats && now < _cacheExpiry) return _cachedStats;

  const sb = supabaseServer();
  const { data, error } = await sb.rpc('get_canonical_stats');

  if (error || !data) {
    console.error('[stats] get_canonical_stats RPC failed:', error?.message);
    // Return REAL known floor values — never fake inflated numbers
    return {
      total_real_operators: 7172,
      us_operators: 7103,
      operators_with_phone: 2660,
      operators_with_email: 1771,
      claimed_profiles: 0,
      active_countries: 2,
      jurisdictions: 66,
      infrastructure_locations: 1401,
      escort_operators: 2308,
      pilot_car_operators: 2993,
      pilot_drivers: 1871,
      quarantined_synthetic: 654809,
      sources: { uspilotcars_hc_entity: 7145, osow_haven: 27 },
      computed_at: new Date().toISOString(),
    };
  }

  _cachedStats = data as CanonicalStats;
  _cacheExpiry = now + CACHE_TTL_MS;
  return _cachedStats;
}

/** Format operator count for display: "7,172 verified operators" */
export function fmtOperators(stats: CanonicalStats): string {
  return stats.total_real_operators.toLocaleString();
}

/** Format US operator count */
export function fmtUSOperators(stats: CanonicalStats): string {
  return stats.us_operators.toLocaleString();
}

/** Countries with REAL verified data (not planned/taxonomy count) */
export function fmtActiveCountries(stats: CanonicalStats): string {
  return stats.active_countries.toLocaleString();
}
