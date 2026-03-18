/**
 * Haul Command Load Board Ingestion v3 — Corridor Intelligence
 *
 * Builds corridor records, route families, pricing by corridor,
 * and derived speed/velocity intelligence from parsed observations.
 * v3 adds: route families, pricing aggregation, enhanced velocity.
 */

import type {
  ParsedObservation,
  CorridorRecord,
  CorridorScores,
  ServiceType,
} from './types';

// ─── Corridor Builder ────────────────────────────────────────────

export class CorridorIntelligence {
  private corridors = new Map<string, CorridorRecord>();

  processObservation(obs: ParsedObservation): void {
    if (!obs.origin_admin_division || !obs.destination_admin_division) return;

    const key = `${obs.origin_admin_division}→${obs.destination_admin_division}`;
    const existing = this.corridors.get(key);

    if (existing) {
      existing.observation_count += 1;
      existing.last_seen = obs.observed_date ?? new Date().toISOString();

      if (obs.service_type !== 'unknown' && !existing.service_types_seen.includes(obs.service_type)) {
        existing.service_types_seen.push(obs.service_type);
      }
      if (obs.parsed_name_or_company && !existing.actors_seen.includes(obs.parsed_name_or_company)) {
        existing.actors_seen.push(obs.parsed_name_or_company);
      }

      // Recalculate urgency density
      if (obs.urgency !== 'unspecified') {
        const urgentCount = existing.urgency_density * (existing.observation_count - 1) + 1;
        existing.urgency_density = urgentCount / existing.observation_count;
      } else {
        const urgentCount = existing.urgency_density * (existing.observation_count - 1);
        existing.urgency_density = urgentCount / existing.observation_count;
      }

      // v3: pricing aggregation
      if (obs.pricing?.quoted_amount) {
        const prevTotal = (existing.avg_price ?? 0) * existing.price_observations;
        existing.price_observations += 1;
        existing.avg_price = (prevTotal + obs.pricing.quoted_amount) / existing.price_observations;
      }
    } else {
      this.corridors.set(key, {
        corridor_key: key,
        origin_raw: obs.origin_raw ?? '',
        destination_raw: obs.destination_raw ?? '',
        origin_admin_division: obs.origin_admin_division!,
        destination_admin_division: obs.destination_admin_division!,
        country_code: obs.country_code ?? '',
        route_family_key: obs.route_family_key,
        observation_count: 1,
        service_types_seen: obs.service_type !== 'unknown' ? [obs.service_type] : [],
        actors_seen: obs.parsed_name_or_company ? [obs.parsed_name_or_company] : [],
        urgency_density: obs.urgency !== 'unspecified' ? 1 : 0,
        avg_price: obs.pricing?.quoted_amount ?? null,
        price_observations: obs.pricing?.quoted_amount ? 1 : 0,
        first_seen: obs.observed_date ?? new Date().toISOString(),
        last_seen: obs.observed_date ?? new Date().toISOString(),
      });
    }
  }

  getCorridors(): CorridorRecord[] {
    return Array.from(this.corridors.values());
  }

  getTopCorridors(limit: number = 10): CorridorRecord[] {
    return this.getCorridors()
      .sort((a, b) => b.observation_count - a.observation_count)
      .slice(0, limit);
  }

  getEmergingCorridors(): CorridorRecord[] {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return this.getCorridors()
      .filter((c) => {
        const firstSeen = new Date(c.first_seen).getTime();
        return now - firstSeen < oneWeek && c.observation_count >= 2;
      })
      .sort((a, b) => b.observation_count - a.observation_count);
  }

  getRouteFamilies(): Map<string, CorridorRecord[]> {
    const families = new Map<string, CorridorRecord[]>();
    for (const c of this.corridors.values()) {
      const fam = c.route_family_key ?? 'ungrouped';
      const arr = families.get(fam) ?? [];
      arr.push(c);
      families.set(fam, arr);
    }
    return families;
  }

  getPricedCorridors(): CorridorRecord[] {
    return this.getCorridors()
      .filter((c) => c.price_observations > 0)
      .sort((a, b) => b.price_observations - a.price_observations);
  }

  getServiceMixByCorridor(): Map<string, Record<ServiceType, number>> {
    const result = new Map<string, Record<ServiceType, number>>();
    for (const corridor of this.corridors.values()) {
      const mix: Record<string, number> = {};
      for (const svc of corridor.service_types_seen) {
        mix[svc] = (mix[svc] ?? 0) + 1;
      }
      result.set(corridor.corridor_key, mix as Record<ServiceType, number>);
    }
    return result;
  }
}

// ─── Corridor Scoring ────────────────────────────────────────────

export function scoreCorridor(corridor: CorridorRecord): CorridorScores {
  const strengthRaw = Math.min(corridor.observation_count / 20, 1);
  const actorDiversity = Math.min(corridor.actors_seen.length / 5, 1);
  const volumeScore = (strengthRaw + actorDiversity) / 2;

  let fastCover = 0;
  if (corridor.urgency_density > 0.3) fastCover += 0.3;
  if (corridor.observation_count >= 5) fastCover += 0.2;
  if (corridor.actors_seen.length >= 3) fastCover += 0.2;
  if (corridor.service_types_seen.length >= 2) fastCover += 0.15;
  fastCover += corridor.urgency_density * 0.15;

  const velocity =
    corridor.actors_seen.length > 0
      ? corridor.observation_count / corridor.actors_seen.length
      : corridor.observation_count;
  const boardVelocity = Math.min(velocity / 10, 1);

  // v3: avg price per mile from pricing data
  const avgPricePerMile: number | null = null; // calculated from external pricing obs

  return {
    corridor_strength_score: round(strengthRaw),
    volume_score: round(volumeScore),
    urgency_density: round(corridor.urgency_density),
    fast_cover_environment_score: round(fastCover),
    board_velocity_signal: round(boardVelocity),
    avg_price_per_mile: avgPricePerMile,
  };
}

// ─── Volume Intelligence Builder ─────────────────────────────────

export function buildDailyVolume(
  observations: ParsedObservation[]
): Map<string, {
  total: number;
  by_service: Record<string, number>;
  by_admin: Record<string, number>;
  by_country: Record<string, number>;
  urgent: number;
  price_obs: number;
}> {
  const daily = new Map<string, {
    total: number;
    by_service: Record<string, number>;
    by_admin: Record<string, number>;
    by_country: Record<string, number>;
    urgent: number;
    price_obs: number;
  }>();

  for (const obs of observations) {
    const dateKey = obs.observed_date?.split('T')[0] ?? 'unknown';
    let day = daily.get(dateKey);
    if (!day) {
      day = { total: 0, by_service: {}, by_admin: {}, by_country: {}, urgent: 0, price_obs: 0 };
      daily.set(dateKey, day);
    }

    day.total += 1;
    day.by_service[obs.service_type] = (day.by_service[obs.service_type] ?? 0) + 1;

    if (obs.origin_admin_division) {
      day.by_admin[obs.origin_admin_division] = (day.by_admin[obs.origin_admin_division] ?? 0) + 1;
    }
    if (obs.country_code) {
      day.by_country[obs.country_code] = (day.by_country[obs.country_code] ?? 0) + 1;
    }
    if (obs.urgency !== 'unspecified') day.urgent += 1;
    if (obs.pricing) day.price_obs += 1;
  }

  return daily;
}

// ─── Speed-to-Cover Logic ────────────────────────────────────────

export function calculateBoardVelocity(observations: ParsedObservation[]): number {
  if (observations.length === 0) return 0;

  let score = 0;

  const urgentCount = observations.filter((o) => o.urgency !== 'unspecified').length;
  score += (urgentCount / observations.length) * 0.3;

  const timedCount = observations.filter((o) => o.urgency === 'timed').length;
  score += (timedCount / observations.length) * 0.2;

  // Same-day repeat actors
  const actorsByDate = new Map<string, Map<string, number>>();
  for (const obs of observations) {
    const date = obs.observed_date?.split('T')[0] ?? 'unknown';
    if (obs.parsed_name_or_company) {
      let dm = actorsByDate.get(date);
      if (!dm) { dm = new Map(); actorsByDate.set(date, dm); }
      dm.set(obs.parsed_name_or_company, (dm.get(obs.parsed_name_or_company) ?? 0) + 1);
    }
  }
  let repeatSignal = 0;
  for (const [, actors] of actorsByDate) {
    for (const [, count] of actors) {
      if (count > 1) repeatSignal += 0.05;
    }
  }
  score += Math.min(repeatSignal, 0.3);

  score += Math.min(observations.length / 50, 0.2);

  return round(Math.min(score, 1));
}

// ─── Pricing Intelligence Aggregator (v3) ────────────────────────

export function buildPricingSummary(observations: ParsedObservation[]): {
  total_price_observations: number;
  avg_quoted_amount: number | null;
  avg_pay_per_mile: number | null;
  price_by_corridor: { corridor: string; avg_price: number; count: number }[];
  price_by_service: Record<string, { avg: number; count: number }>;
} {
  const priced = observations.filter((o) => o.pricing !== null);
  if (priced.length === 0) {
    return {
      total_price_observations: 0,
      avg_quoted_amount: null,
      avg_pay_per_mile: null,
      price_by_corridor: [],
      price_by_service: {},
    };
  }

  const amounts = priced.filter((o) => o.pricing!.quoted_amount).map((o) => o.pricing!.quoted_amount!);
  const ppms = priced.filter((o) => o.pricing!.derived_pay_per_mile).map((o) => o.pricing!.derived_pay_per_mile!);

  const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null;
  const avgPPM = ppms.length > 0 ? ppms.reduce((a, b) => a + b, 0) / ppms.length : null;

  // By corridor
  const corridorPrices = new Map<string, { total: number; count: number }>();
  for (const obs of priced) {
    if (obs.corridor_key && obs.pricing!.quoted_amount) {
      const existing = corridorPrices.get(obs.corridor_key) ?? { total: 0, count: 0 };
      existing.total += obs.pricing!.quoted_amount;
      existing.count += 1;
      corridorPrices.set(obs.corridor_key, existing);
    }
  }
  const priceByCorridor = Array.from(corridorPrices.entries())
    .map(([corridor, data]) => ({ corridor, avg_price: round(data.total / data.count), count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // By service type
  const servicePrices: Record<string, { total: number; count: number }> = {};
  for (const obs of priced) {
    if (obs.pricing!.quoted_amount) {
      const key = obs.service_type;
      if (!servicePrices[key]) servicePrices[key] = { total: 0, count: 0 };
      servicePrices[key].total += obs.pricing!.quoted_amount;
      servicePrices[key].count += 1;
    }
  }
  const priceByService: Record<string, { avg: number; count: number }> = {};
  for (const [key, data] of Object.entries(servicePrices)) {
    priceByService[key] = { avg: round(data.total / data.count), count: data.count };
  }

  return {
    total_price_observations: priced.length,
    avg_quoted_amount: avgAmount ? round(avgAmount) : null,
    avg_pay_per_mile: avgPPM ? round(avgPPM) : null,
    price_by_corridor: priceByCorridor,
    price_by_service: priceByService,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
