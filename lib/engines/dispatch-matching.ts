// ══════════════════════════════════════════════════════════════
// DISPATCH MATCHING SERVICE — wired to v_dispatch_ready_supply_internal
//
// Replaces hardcoded mock data in dispatch/page.tsx with real
// supply from the dispatch_supply table via the production view.
// ══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

// ── Types ──

export interface DispatchReadySupply {
  entity_id: string;
  display_name: string;
  country_id: string;
  country_code: string;
  country_role_id: string;
  local_title: string;
  role_key: string;
  availability_status: string;
  accepts_urgent: boolean;
  accepts_night_moves: boolean;
  accepts_cross_border: boolean;
  priority_score: number;
  trust_score_snapshot: number | null;
  home_lat: number | null;
  home_lng: number | null;
  last_seen_at: string | null;
}

export interface DispatchFilters {
  country_code?: string;
  role_key?: string;
  accepts_urgent?: boolean;
  accepts_night_moves?: boolean;
  accepts_cross_border?: boolean;
  min_trust_score?: number;
  near_lat?: number;
  near_lng?: number;
  radius_km?: number;
  limit?: number;
}

export interface DispatchStats {
  total_available: number;
  urgent_capable: number;
  night_capable: number;
  cross_border_capable: number;
  avg_trust_score: number;
  by_role: Record<string, number>;
  by_country: Record<string, number>;
}

// ══════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════

/**
 * fetchDispatchReadySupply — Primary read for dispatch matching.
 * Reads from v_dispatch_ready_supply_internal.
 */
export async function fetchDispatchReadySupply(
  filters: DispatchFilters = {}
): Promise<DispatchReadySupply[]> {
  const supabase = createClient();
  const limit = filters.limit ?? 50;

  let query = supabase
    .from('v_dispatch_ready_supply_internal')
    .select('*');

  if (filters.country_code) {
    query = query.eq('country_code', filters.country_code.toUpperCase());
  }
  if (filters.role_key) {
    query = query.eq('role_key', filters.role_key);
  }
  if (filters.accepts_urgent) {
    query = query.eq('accepts_urgent', true);
  }
  if (filters.accepts_night_moves) {
    query = query.eq('accepts_night_moves', true);
  }
  if (filters.accepts_cross_border) {
    query = query.eq('accepts_cross_border', true);
  }
  if (filters.min_trust_score) {
    query = query.gte('trust_score_snapshot', filters.min_trust_score);
  }

  // Geo filtering via bounding box approximation
  if (filters.near_lat && filters.near_lng && filters.radius_km) {
    const latDelta = filters.radius_km / 111;
    const lngDelta = filters.radius_km / (111 * Math.cos((filters.near_lat * Math.PI) / 180));
    query = query
      .gte('home_lat', filters.near_lat - latDelta)
      .lte('home_lat', filters.near_lat + latDelta)
      .gte('home_lng', filters.near_lng - lngDelta)
      .lte('home_lng', filters.near_lng + lngDelta);
  }

  query = query
    .order('priority_score', { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('[dispatch] Supply query error:', error.message);
    return [];
  }

  return (data ?? []) as DispatchReadySupply[];
}

/**
 * fetchDispatchStats — Aggregate ready-supply metrics for HUD.
 */
export async function fetchDispatchStats(
  country_code?: string
): Promise<DispatchStats> {
  const supabase = createClient();

  let query = supabase
    .from('v_dispatch_ready_supply_internal')
    .select('role_key, country_code, accepts_urgent, accepts_night_moves, accepts_cross_border, trust_score_snapshot');

  if (country_code) {
    query = query.eq('country_code', country_code.toUpperCase());
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total_available: 0,
      urgent_capable: 0,
      night_capable: 0,
      cross_border_capable: 0,
      avg_trust_score: 0,
      by_role: {},
      by_country: {},
    };
  }

  const by_role: Record<string, number> = {};
  const by_country: Record<string, number> = {};
  let urgentCount = 0;
  let nightCount = 0;
  let crossBorderCount = 0;
  let trustSum = 0;
  let trustCount = 0;

  for (const row of data) {
    by_role[row.role_key] = (by_role[row.role_key] || 0) + 1;
    by_country[row.country_code] = (by_country[row.country_code] || 0) + 1;
    if (row.accepts_urgent) urgentCount++;
    if (row.accepts_night_moves) nightCount++;
    if (row.accepts_cross_border) crossBorderCount++;
    if (row.trust_score_snapshot != null) {
      trustSum += row.trust_score_snapshot;
      trustCount++;
    }
  }

  return {
    total_available: data.length,
    urgent_capable: urgentCount,
    night_capable: nightCount,
    cross_border_capable: crossBorderCount,
    avg_trust_score: trustCount > 0 ? Math.round(trustSum / trustCount) : 0,
    by_role,
    by_country,
  };
}

/**
 * matchDispatchForJob — Find the best available operators for a specific job.
 * This is the core dispatch-matching algorithm entry point.
 */
export async function matchDispatchForJob(params: {
  country_code: string;
  role_key: string;
  origin_lat: number;
  origin_lng: number;
  is_urgent: boolean;
  is_night_move: boolean;
  is_cross_border: boolean;
  max_results?: number;
}): Promise<DispatchReadySupply[]> {
  const supply = await fetchDispatchReadySupply({
    country_code: params.country_code,
    role_key: params.role_key,
    accepts_urgent: params.is_urgent || undefined,
    accepts_night_moves: params.is_night_move || undefined,
    accepts_cross_border: params.is_cross_border || undefined,
    near_lat: params.origin_lat,
    near_lng: params.origin_lng,
    radius_km: 200, // Initial radius
    limit: params.max_results ?? 20,
  });

  // If not enough results, widen search
  if (supply.length < 3) {
    const wider = await fetchDispatchReadySupply({
      country_code: params.country_code,
      role_key: params.role_key,
      near_lat: params.origin_lat,
      near_lng: params.origin_lng,
      radius_km: 500, // Wider radius
      limit: params.max_results ?? 20,
    });
    return wider;
  }

  return supply;
}
