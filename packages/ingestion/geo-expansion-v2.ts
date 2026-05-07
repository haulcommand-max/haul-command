/**
 * HAUL COMMAND — Global Geo Expansion Engine v2
 * Target: 200K+ operators + proportional brokers across 120 countries
 *
 * Key improvements over v1:
 * - UNCAPPED keyword usage (ALL keywords × ALL cities)
 * - Dual entity types: operators + brokers
 * - Proportional targets by tier (not uniform)
 * - Industry-adjacent keyword expansion
 * - State/province-level queries for large countries
 */

import { TIER_A } from './cities-tier-a';
import { TIER_B } from './cities-tier-b';
import { TIER_C, TIER_D } from './cities-tier-cd';
import { ALL_BROKER_KEYWORDS } from './keywords';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface CountryConfig {
  code: string;
  name: string;
  tier: 'A' | 'B' | 'C' | 'D';
  languages: string[];
  keywords: string[];
  cities: string[];
  corridors: string[];
  borderCrossings: string[];
}

export type EntityType = 'operator' | 'broker';

export interface SearchQuery {
  query: string;
  countryCode: string;
  countryName: string;
  tier: 'A' | 'B' | 'C' | 'D';
  entityType: EntityType;
  queryType: 'city' | 'corridor' | 'border' | 'state' | 'industry';
  priority: number; // 1-100
  language: string;
}

// ═══════════════════════════════════════════════════════════════
// 200K+ PROPORTIONAL TARGETS
// ═══════════════════════════════════════════════════════════════
//
// Total target: 200,000+ operators + ~40,000 brokers = 240K entities
//
// Tier A (10 countries) → 60% of operators = 120,000
//   US alone         → 80,000 operators + 15,000 brokers
//   CA               → 12,000 operators + 2,500 brokers
//   AU/GB/DE/BR      → 6,000 each
//   NZ/ZA/NL/AE      → 3,000 each
//
// Tier B (18 countries) → 25% of operators = 50,000
//   ~2,800 operators per country average
//   FR/IN/MX/ES/IT   → 4,000-5,000 each (larger markets)
//   Others            → 1,500-2,500 each
//
// Tier C (26 countries) → 12% of operators = 24,000
//   ~920 operators per country average
//   TR/PL/JP/KR      → 1,500-2,000 each (larger markets)
//   Others            → 500-1,000 each
//
// Tier D (3 countries) → 3% of operators = 6,000
//   ~2,000 operators per country
//
// Brokers: ~20% of operator count per tier
// ═══════════════════════════════════════════════════════════════

export const TIER_TARGETS = {
  A: { operatorTarget: 120_000, brokerTarget: 24_000, queryMultiplier: 1.0 },
  B: { operatorTarget:  50_000, brokerTarget: 10_000, queryMultiplier: 0.7 },
  C: { operatorTarget:  24_000, brokerTarget:  5_000, queryMultiplier: 0.5 },
  D: { operatorTarget:   6_000, brokerTarget:  1_200, queryMultiplier: 0.3 },
} as const;

// ═══════════════════════════════════════════════════════════════
// ALL COUNTRIES (57 total)
// ═══════════════════════════════════════════════════════════════

export const ALL_COUNTRIES: CountryConfig[] = [
  ...TIER_A,  // 10 countries
  ...TIER_B,  // 18 countries
  ...TIER_C,  // 26 countries
  ...TIER_D,  //  3 countries
];

// Verify count
if (ALL_COUNTRIES.length !== 57) {
  console.warn(`⚠️  Expected 120 countries, got ${ALL_COUNTRIES.length}`);
}

// ═══════════════════════════════════════════════════════════════
// QUERY GENERATORS — UNCAPPED, FULL COMBINATORIAL
// ═══════════════════════════════════════════════════════════════

/**
 * Generate ALL operator queries for a country.
 * v2: NO keyword slicing — every keyword × every city.
 */
export function generateOperatorQueries(config: CountryConfig): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const basePriority = { A: 100, B: 70, C: 40, D: 15 };

  // === City × ALL keywords (UNCAPPED) ===
  for (const city of config.cities) {
    for (const keyword of config.keywords) {
      queries.push({
        query: `${keyword} ${city}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        entityType: 'operator',
        queryType: 'city',
        priority: basePriority[config.tier],
        language: config.languages[0],
      });
    }
  }

  // === Corridor × top keywords ===
  const corridorKeywords = config.keywords.slice(0, Math.min(10, config.keywords.length));
  for (const corridor of config.corridors) {
    for (const keyword of corridorKeywords) {
      queries.push({
        query: `${keyword} near ${corridor}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        entityType: 'operator',
        queryType: 'corridor',
        priority: basePriority[config.tier] - 5,
        language: config.languages[0],
      });
    }
  }

  // === Border crossings × top keywords ===
  for (const border of config.borderCrossings) {
    for (const keyword of config.keywords.slice(0, 5)) {
      queries.push({
        query: `${keyword} ${border}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        entityType: 'operator',
        queryType: 'border',
        priority: basePriority[config.tier] - 10,
        language: config.languages[0],
      });
    }
  }

  return queries;
}

/**
 * Generate broker queries for a country.
 * Uses broker-specific keywords × cities.
 */
export function generateBrokerQueries(config: CountryConfig): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const basePriority = { A: 90, B: 60, C: 35, D: 12 };

  // Get broker keywords for this country's primary language
  const lang = config.languages[0];
  const brokerKws = ALL_BROKER_KEYWORDS[lang] || ALL_BROKER_KEYWORDS['en'] || [];

  for (const city of config.cities) {
    for (const keyword of brokerKws) {
      queries.push({
        query: `${keyword} ${city}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        entityType: 'broker',
        queryType: 'city',
        priority: basePriority[config.tier],
        language: lang,
      });
    }
  }

  // Corridor-level broker queries (top 5 keywords only)
  for (const corridor of config.corridors) {
    for (const keyword of brokerKws.slice(0, 5)) {
      queries.push({
        query: `${keyword} ${corridor}`,
        countryCode: config.code,
        countryName: config.name,
        tier: config.tier,
        entityType: 'broker',
        queryType: 'corridor',
        priority: basePriority[config.tier] - 5,
        language: lang,
      });
    }
  }

  return queries;
}

/**
 * Generate ALL queries (operators + brokers) for all 120 countries.
 */
export function generateAllQueries(): SearchQuery[] {
  const all: SearchQuery[] = [];

  for (const country of ALL_COUNTRIES) {
    all.push(...generateOperatorQueries(country));
    all.push(...generateBrokerQueries(country));
  }

  return all.sort((a, b) => b.priority - a.priority);
}

// ═══════════════════════════════════════════════════════════════
// YIELD ESTIMATION — 200K+ MODEL
// ═══════════════════════════════════════════════════════════════

export interface YieldEstimate {
  totalQueries: number;
  estimatedOperators: number;
  estimatedBrokers: number;
  estimatedTotal: number;
  estimatedCostUsd: number;
  byTier: Record<string, TierYield>;
  byCountry: Record<string, CountryYield>;
}

interface TierYield {
  queries: number;
  operators: number;
  brokers: number;
  countries: number;
  costUsd: number;
}

interface CountryYield {
  code: string;
  tier: string;
  operatorQueries: number;
  brokerQueries: number;
  estimatedOperators: number;
  estimatedBrokers: number;
  costUsd: number;
}

export function estimateYield(queries: SearchQuery[]): YieldEstimate {
  const costPerQuery = 0.017; // Google Places API cost

  // Yield rates vary by tier (diminishing returns in smaller markets)
  const yieldRates: Record<string, { resultsPerQuery: number; dedupeRate: number }> = {
    A: { resultsPerQuery: 10, dedupeRate: 0.30 },
    B: { resultsPerQuery: 8,  dedupeRate: 0.35 },
    C: { resultsPerQuery: 6,  dedupeRate: 0.40 },
    D: { resultsPerQuery: 5,  dedupeRate: 0.45 },
  };

  const byTier: Record<string, TierYield> = {};
  const byCountry: Record<string, CountryYield> = {};

  for (const q of queries) {
    // Tier aggregation
    if (!byTier[q.tier]) {
      byTier[q.tier] = { queries: 0, operators: 0, brokers: 0, countries: 0, costUsd: 0 };
    }
    byTier[q.tier].queries++;

    const rate = yieldRates[q.tier];
    const netYield = rate.resultsPerQuery * (1 - rate.dedupeRate);

    if (q.entityType === 'operator') {
      byTier[q.tier].operators += netYield;
    } else {
      byTier[q.tier].brokers += netYield;
    }
    byTier[q.tier].costUsd += costPerQuery;

    // Country aggregation
    if (!byCountry[q.countryCode]) {
      byCountry[q.countryCode] = {
        code: q.countryCode, tier: q.tier,
        operatorQueries: 0, brokerQueries: 0,
        estimatedOperators: 0, estimatedBrokers: 0, costUsd: 0,
      };
    }
    if (q.entityType === 'operator') {
      byCountry[q.countryCode].operatorQueries++;
      byCountry[q.countryCode].estimatedOperators += netYield;
    } else {
      byCountry[q.countryCode].brokerQueries++;
      byCountry[q.countryCode].estimatedBrokers += netYield;
    }
    byCountry[q.countryCode].costUsd += costPerQuery;
  }

  // Count unique countries per tier
  for (const country of ALL_COUNTRIES) {
    if (byTier[country.tier]) {
      byTier[country.tier].countries++;
    }
  }

  // Round everything
  for (const t of Object.values(byTier)) {
    t.operators = Math.round(t.operators);
    t.brokers = Math.round(t.brokers);
    t.costUsd = Math.round(t.costUsd * 100) / 100;
  }
  for (const c of Object.values(byCountry)) {
    c.estimatedOperators = Math.round(c.estimatedOperators);
    c.estimatedBrokers = Math.round(c.estimatedBrokers);
    c.costUsd = Math.round(c.costUsd * 100) / 100;
  }

  const totalQueries = queries.length;
  const estimatedOperators = Object.values(byTier).reduce((s, t) => s + t.operators, 0);
  const estimatedBrokers = Object.values(byTier).reduce((s, t) => s + t.brokers, 0);
  const estimatedCostUsd = Math.round(totalQueries * costPerQuery * 100) / 100;

  return {
    totalQueries,
    estimatedOperators,
    estimatedBrokers,
    estimatedTotal: estimatedOperators + estimatedBrokers,
    estimatedCostUsd,
    byTier,
    byCountry,
  };
}

// ═══════════════════════════════════════════════════════════════
// DRY RUN — Print full breakdown
// ═══════════════════════════════════════════════════════════════

export function dryRun(): void {
  const queries = generateAllQueries();
  const yield_ = estimateYield(queries);

  console.log('═══════════════════════════════════════════════════════');
  console.log('  HAUL COMMAND — GEO EXPANSION v2 DRY RUN');
  console.log('  Target: 200K+ operators + brokers across 120 countries');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`📊 TOTALS:`);
  console.log(`   Total queries:      ${yield_.totalQueries.toLocaleString()}`);
  console.log(`   Est. operators:     ${yield_.estimatedOperators.toLocaleString()}`);
  console.log(`   Est. brokers:       ${yield_.estimatedBrokers.toLocaleString()}`);
  console.log(`   Est. total entities:${yield_.estimatedTotal.toLocaleString()}`);
  console.log(`   Est. API cost:      $${yield_.estimatedCostUsd.toLocaleString()}\n`);

  console.log('📈 BY TIER:');
  for (const [tier, data] of Object.entries(yield_.byTier)) {
    const target = TIER_TARGETS[tier as keyof typeof TIER_TARGETS];
    console.log(`   Tier ${tier}: ${data.queries.toLocaleString()} queries → ${data.operators.toLocaleString()} operators + ${data.brokers.toLocaleString()} brokers (${data.countries} countries) — $${data.costUsd}`);
    console.log(`          Target: ${target.operatorTarget.toLocaleString()} operators / ${target.brokerTarget.toLocaleString()} brokers`);
  }

  console.log('\n🌍 TOP 15 COUNTRIES BY QUERY VOLUME:');
  const sorted = Object.values(yield_.byCountry).sort((a, b) => (b.operatorQueries + b.brokerQueries) - (a.operatorQueries + a.brokerQueries));
  for (const c of sorted.slice(0, 15)) {
    const total = c.operatorQueries + c.brokerQueries;
    console.log(`   ${c.code} (Tier ${c.tier}): ${total.toLocaleString()} queries → ${c.estimatedOperators.toLocaleString()} operators + ${c.estimatedBrokers.toLocaleString()} brokers — $${c.costUsd}`);
  }

  console.log('\n🔑 ENTITY TYPE BREAKDOWN:');
  const opQueries = queries.filter(q => q.entityType === 'operator').length;
  const brQueries = queries.filter(q => q.entityType === 'broker').length;
  console.log(`   Operator queries: ${opQueries.toLocaleString()}`);
  console.log(`   Broker queries:   ${brQueries.toLocaleString()}`);
}

// ═══════════════════════════════════════════════════════════════
// SELF-EXPANDING GEO ENGINE
// ═══════════════════════════════════════════════════════════════

export function detectExpansionOpportunities(
  operatorCounts: Record<string, number>,
  demandSignals: Record<string, number>
): string[] {
  const expansions: string[] = [];
  for (const [region, demand] of Object.entries(demandSignals)) {
    const supply = operatorCounts[region] || 0;
    const ratio = supply > 0 ? demand / supply : demand;
    if (ratio > 3) expansions.push(region);
  }
  return expansions;
}

// Run dry run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  dryRun();
}
