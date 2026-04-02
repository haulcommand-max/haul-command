// lib/data/dispatch-matcher.ts — HAUL COMMAND Money OS Dispatch Matching
// Wires the v_dispatch_ready_supply_internal view into the dispatch engine.
//
// Replaces the old hc_global_operators availability queries with the
// canonical dispatch_supply table + country_roles + canonical_roles.

import { supabaseAdmin } from '@/lib/supabase/admin';

export type DispatchCandidate = {
  entity_id: string;
  display_name: string;
  country_code: string;
  role_key: string;
  local_title: string;
  availability_status: string;
  accepts_urgent: boolean;
  accepts_night_moves: boolean;
  accepts_cross_border: boolean;
  priority_score: number;
  trust_score_snapshot: number;
  home_lat: number | null;
  home_lng: number | null;
  last_seen_at: string | null;
  distance_miles?: number; // computed client-side
};

export type DispatchQuery = {
  country_code: string;
  role_key?: string;
  urgent_only?: boolean;
  night_move?: boolean;
  cross_border?: boolean;
  origin_lat?: number;
  origin_lng?: number;
  radius_miles?: number;
  limit?: number;
};

/**
 * Query the dispatch-ready supply from the Money OS view.
 * Returns ranked candidates sorted by priority_score + trust_score.
 *
 * Replaces: hc_global_operators + availability_status = 'available'
 * With:     v_dispatch_ready_supply_internal (pre-filtered, pre-joined)
 */
export async function findDispatchCandidates(
  query: DispatchQuery
): Promise<DispatchCandidate[]> {
  let q = supabaseAdmin
    .from('v_dispatch_ready_supply_internal')
    .select('*')
    .eq('country_code', query.country_code.toUpperCase())
    .order('priority_score', { ascending: false })
    .order('trust_score_snapshot', { ascending: false })
    .limit(query.limit || 50);

  if (query.role_key) {
    q = q.eq('role_key', query.role_key);
  }
  if (query.urgent_only) {
    q = q.eq('accepts_urgent', true);
  }
  if (query.night_move) {
    q = q.eq('accepts_night_moves', true);
  }
  if (query.cross_border) {
    q = q.eq('accepts_cross_border', true);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[dispatch-matcher] Query failed:', error.message);
    return [];
  }

  let candidates = (data || []) as DispatchCandidate[];

  // If origin coordinates provided, compute distance and filter by radius
  if (query.origin_lat && query.origin_lng && query.radius_miles) {
    candidates = candidates
      .map(c => ({
        ...c,
        distance_miles: c.home_lat && c.home_lng
          ? haversineDistance(query.origin_lat!, query.origin_lng!, c.home_lat, c.home_lng)
          : Infinity,
      }))
      .filter(c => c.distance_miles <= (query.radius_miles || 200))
      .sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
  }

  return candidates;
}

/**
 * Register or update supply availability in the dispatch_supply table.
 * Called when an operator sets their status via the mobile app.
 */
export async function updateOperatorSupply(params: {
  entity_id: string;
  country_id: string;
  country_role_id: string;
  availability_status: 'available' | 'busy' | 'off_duty' | 'en_route';
  accepts_urgent?: boolean;
  accepts_night_moves?: boolean;
  accepts_cross_border?: boolean;
  home_lat?: number;
  home_lng?: number;
}) {
  const { error } = await supabaseAdmin
    .from('dispatch_supply')
    .upsert({
      entity_id: params.entity_id,
      country_id: params.country_id,
      country_role_id: params.country_role_id,
      availability_status: params.availability_status,
      accepts_urgent: params.accepts_urgent ?? false,
      accepts_night_moves: params.accepts_night_moves ?? false,
      accepts_cross_border: params.accepts_cross_border ?? false,
      home_lat: params.home_lat || null,
      home_lng: params.home_lng || null,
      last_seen_at: new Date().toISOString(),
    }, {
      onConflict: 'entity_id,country_role_id',
    });

  if (error) {
    console.error('[dispatch-matcher] Supply update failed:', error.message);
    throw new Error(`Supply update failed: ${error.message}`);
  }
}

/**
 * Get dispatch dashboard stats for a country.
 */
export async function getDispatchStats(countryCode: string) {
  const { data, error } = await supabaseAdmin
    .from('v_dispatch_ready_supply_internal')
    .select('role_key, availability_status, accepts_urgent')
    .eq('country_code', countryCode.toUpperCase());

  if (error || !data) return { available: 0, urgent_capable: 0, by_role: {} };

  const byRole: Record<string, number> = {};
  data.forEach((d: any) => {
    byRole[d.role_key] = (byRole[d.role_key] || 0) + 1;
  });

  return {
    available: data.length,
    urgent_capable: data.filter((d: any) => d.accepts_urgent).length,
    by_role: byRole,
  };
}

// ── Haversine distance (miles) ──
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
