/**
 * HAUL COMMAND — Real-Time Corridor Intelligence Engine
 * Self-improving pricing + demand data from every load.
 * Merges with existing corridor data infrastructure.
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CorridorData {
  key: string;            // "Houston_TX-Dallas_TX"
  origin: string;
  destination: string;
  demand_count: number;
  avg_rate_cents: number;
  min_rate_cents: number;
  max_rate_cents: number;
  operator_density: number;
  last_load_at: string;
  last_updated: string;
  trend: 'rising' | 'stable' | 'falling';
  urgency_factor: number; // 0-1
}

export interface CorridorScore {
  demand: number;
  pricing: number;
  supply_gap: number;
  overall: number;
  opportunity: 'high' | 'medium' | 'low';
}

// ═══════════════════════════════════════════════════════════════
// ROLLING AVERAGE CALCULATOR
// ═══════════════════════════════════════════════════════════════

function rollingAverage(current: number, newValue: number, weight: number = 0.1): number {
  return Math.round(current * (1 - weight) + newValue * weight);
}

// ═══════════════════════════════════════════════════════════════
// CORRIDOR UPDATE (called on every new load)
// ═══════════════════════════════════════════════════════════════

const corridorCache = new Map<string, CorridorData>();

export function updateCorridor(load: {
  origin: string;
  destination: string;
  price_cents: number;
  urgency?: number;
}): CorridorData {
  const key = `${load.origin}-${load.destination}`.replace(/\s+/g, '_');
  const now = new Date().toISOString();

  let corridor = corridorCache.get(key);

  if (!corridor) {
    corridor = {
      key,
      origin: load.origin,
      destination: load.destination,
      demand_count: 0,
      avg_rate_cents: load.price_cents,
      min_rate_cents: load.price_cents,
      max_rate_cents: load.price_cents,
      operator_density: 0,
      last_load_at: now,
      last_updated: now,
      trend: 'stable',
      urgency_factor: load.urgency || 0.5,
    };
  }

  // Update stats
  corridor.demand_count += 1;
  const prevAvg = corridor.avg_rate_cents;
  corridor.avg_rate_cents = rollingAverage(corridor.avg_rate_cents, load.price_cents);
  corridor.min_rate_cents = Math.min(corridor.min_rate_cents, load.price_cents);
  corridor.max_rate_cents = Math.max(corridor.max_rate_cents, load.price_cents);
  corridor.last_load_at = now;
  corridor.last_updated = now;

  // Trend detection
  if (corridor.avg_rate_cents > prevAvg * 1.05) corridor.trend = 'rising';
  else if (corridor.avg_rate_cents < prevAvg * 0.95) corridor.trend = 'falling';
  else corridor.trend = 'stable';

  corridorCache.set(key, corridor);
  return corridor;
}

// ═══════════════════════════════════════════════════════════════
// CORRIDOR SCORING
// ═══════════════════════════════════════════════════════════════

export function scoreCorridor(corridor: CorridorData): CorridorScore {
  const demand = Math.min(100, corridor.demand_count * 2);
  const pricing = Math.min(100, (corridor.avg_rate_cents / 100) * 0.5);
  const supply_gap = Math.max(0, 100 - corridor.operator_density * 10);
  const overall = demand * 0.4 + pricing * 0.3 + supply_gap * 0.3;

  const opportunity = overall > 70 ? 'high' : overall > 40 ? 'medium' : 'low';

  return { demand, pricing, supply_gap, overall: Math.round(overall), opportunity };
}

// ═══════════════════════════════════════════════════════════════
// AUTO PRICE INCREASE (no match after 5 min)
// ═══════════════════════════════════════════════════════════════

export function autoPriceAdjust(
  currentPriceCents: number,
  minutesElapsed: number,
  matchCount: number
): { adjustedPriceCents: number; reason: string } {
  if (matchCount > 0) return { adjustedPriceCents: currentPriceCents, reason: 'matches_found' };

  if (minutesElapsed >= 15) {
    return {
      adjustedPriceCents: Math.round(currentPriceCents * 1.20),
      reason: 'no_match_15min_20pct_increase',
    };
  }
  if (minutesElapsed >= 10) {
    return {
      adjustedPriceCents: Math.round(currentPriceCents * 1.15),
      reason: 'no_match_10min_15pct_increase',
    };
  }
  if (minutesElapsed >= 5) {
    return {
      adjustedPriceCents: Math.round(currentPriceCents * 1.10),
      reason: 'no_match_5min_10pct_increase',
    };
  }

  return { adjustedPriceCents: currentPriceCents, reason: 'within_window' };
}

// ═══════════════════════════════════════════════════════════════
// DEMAND HEATMAP DATA
// ═══════════════════════════════════════════════════════════════

export function getTopCorridors(limit: number = 20): CorridorData[] {
  return Array.from(corridorCache.values())
    .sort((a, b) => b.demand_count - a.demand_count)
    .slice(0, limit);
}

export function getSupplyGaps(): CorridorData[] {
  return Array.from(corridorCache.values())
    .filter(c => c.operator_density < 3 && c.demand_count > 5);
}
