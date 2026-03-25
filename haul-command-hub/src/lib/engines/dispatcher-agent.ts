/**
 * lib/engines/dispatcher-agent.ts
 * 
 * HAUL COMMAND — DISPATCHER AGENT
 * Autonomous match engine: finds the best available operators for a load.
 * Integrates with real-time corridor intelligence and the pricing engine.
 */

import { supabaseServer } from '@/lib/supabase-server';
import { calculateEstimate } from '@/lib/pricing-engine';
import { STATE_REGION_MAP } from '@/lib/pricing-engine';

export interface LoadInput {
  id?: string;
  origin: string;
  destination: string;
  originState: string;
  originLat?: number;
  originLng?: number;
  serviceType: 'lead_chase' | 'height_pole' | 'bucket_truck' | 'route_survey' | 'police_escort';
  distanceMiles: number;
  urgency: 'low' | 'normal' | 'high' | 'same_day';
  brokerId?: string;
  notes?: string;
}

export interface DispatchMatch {
  operatorId: string;
  operatorName: string;
  phone?: string;
  score: number;
  recommendedPrice: { low: number; mid: number; high: number };
  distanceToLoadMiles?: number;
  hcTrustNumber?: string;
  reason: string;
}

export interface DispatchResult {
  loadId: string;
  matches: DispatchMatch[];
  estimatedMatchTimeMs: number;
  surgeActive: boolean;
  corridorDemandScore: number;
}

export async function runDispatcherAgent(load: LoadInput): Promise<DispatchResult> {
  const sb = supabaseServer();
  const start = Date.now();

  // 1. Get pricing recommendation for this job
  const region = STATE_REGION_MAP[load.originState.toUpperCase()] ?? 'midwest';
  const rushLevel = load.urgency === 'same_day' ? 'sameDay' 
    : load.urgency === 'high' ? 'nextDay' : 'standard';

  const priceEstimate = calculateEstimate({
    serviceType: load.serviceType,
    region,
    distanceMiles: load.distanceMiles,
    rushLevel,
  });

  // 2. Find active operators in the region
  // Match by country_code (US), surface_category, and admin1_code proximity
  const categoryMap: Record<string, string> = {
    lead_chase: 'pilot_car',
    height_pole: 'pilot_car',
    route_survey: 'pilot_car',
    bucket_truck: 'towing',
    police_escort: 'pilot_car',
  };
  const categoryKey = categoryMap[load.serviceType] ?? 'pilot_car';

  const { data: operators } = await sb
    .from('hc_places')
    .select('id, name, phone, admin1_code, lat, lng, hc_trust_number, claim_status')
    .eq('country_code', 'US')
    .eq('surface_category_key', categoryKey)
    .eq('status', 'published')
    .not('phone', 'is', null)
    .limit(20);

  // 3. Score and rank operators
  const matches: DispatchMatch[] = [];

  for (const op of (operators ?? [])) {
    let score = 50; // base

    // Boost claimed operators (they're real humans)
    if (op.claim_status === 'claimed') score += 25;

    // State match bonus
    if (op.admin1_code === load.originState.toUpperCase()) score += 20;

    // Has geo coords for distance scoring
    if (op.lat && op.lng && load.originLat && load.originLng) {
      const dist = haversine(load.originLat, load.originLng, op.lat, op.lng);
      score += Math.max(0, 20 - dist / 10); // closer = more points
    }

    matches.push({
      operatorId: op.id,
      operatorName: op.name,
      phone: op.phone ?? undefined,
      score: Math.min(100, Math.round(score)),
      recommendedPrice: {
        low: priceEstimate.low,
        mid: priceEstimate.mid,
        high: priceEstimate.high,
      },
      hcTrustNumber: op.hc_trust_number ?? undefined,
      reason: op.claim_status === 'claimed'
        ? 'Claimed & verified operator in target region'
        : 'Active listed operator',
    });
  }

  // 4. Sort by score descending, cap at top 10
  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 10);

  // 5. Check corridor demand signal for surge detection
  let corridorDemandScore = 0.5;
  let surgeActive = false;
  try {
    const { data: corridor } = await sb
      .from('hc_corridors')
      .select('demand_score')
      .or(`origin_state.eq.${load.originState.toUpperCase()},dest_state.eq.${load.originState.toUpperCase()}`)
      .order('demand_score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (corridor?.demand_score) {
      corridorDemandScore = corridor.demand_score;
      surgeActive = corridor.demand_score > 0.75;
    }
  } catch {
    // Corridor table may not yet have this data — skip
  }

  // 6. Store the dispatch run in DB for metrics
  try {
    const { data: insertedLoad } = await sb
      .from('hc_loads')
      .upsert({
        id: load.id ?? crypto.randomUUID(),
        origin: load.origin,
        destination: load.destination,
        origin_state: load.originState,
        service_type: load.serviceType,
        distance_miles: load.distanceMiles,
        urgency: load.urgency,
        broker_id: load.brokerId ?? null,
        status: 'open',
        recommended_price_mid: priceEstimate.mid,
        surge_active: surgeActive,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    if (insertedLoad?.id && topMatches.length > 0) {
      // Log the top match
      await sb.from('hc_dispatch_matches').insert({
        load_id: insertedLoad.id,
        operator_id: topMatches[0].operatorId,
        match_score: topMatches[0].score,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }
  } catch {
    // Non-critical — table may not exist yet
  }

  return {
    loadId: load.id ?? 'new',
    matches: topMatches,
    estimatedMatchTimeMs: Date.now() - start,
    surgeActive,
    corridorDemandScore,
  };
}

// ─── Haversine distance formula ───────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg: number) { return (deg * Math.PI) / 180; }
