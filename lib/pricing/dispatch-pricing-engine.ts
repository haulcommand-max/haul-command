/**
 * ═══════════════════════════════════════════════════════════════
 * AI DISPATCH PRICING ENGINE — Full Logic
 * 
 * MERGES existing lib/pricing/engine.ts (country multipliers,
 * heat bands, Carvana-style labeling) with:
 *   - Weight/dimension complexity factors
 *   - Escort cost layering
 *   - Urgency multipliers
 *   - Supply/demand market scoring
 *   - Self-improving feedback loop
 *   - Acceptance rate optimization
 * 
 * This is the MONEY ENGINE. Every decimal matters.
 * ═══════════════════════════════════════════════════════════════
 */

import { calculatePriceBand, labelPrice, type PriceInputs, type PriceBand, type PriceLabel } from '@/lib/pricing/engine';

// ── DISPATCH PRICING INPUTS ─────────────────────────────────

export interface DispatchPriceInputs {
  // Route
  origin: string;
  destination: string;
  distance_miles: number;
  states_crossed: string[];
  
  // Load
  weight_lbs: number;
  height_ft: number;
  width_ft: number;
  length_ft: number;
  
  // Requirements
  escorts_required: number;
  police_required: boolean;
  permits_required: number;
  night_move: boolean;
  superload: boolean;  // > 200,000 lbs or multi-hundred-foot
  
  // Market
  corridor_demand_score: number;  // 0-100
  operator_supply_score: number;  // 0-100
  
  // Urgency
  urgency: 'standard' | 'rush' | 'emergency';
  
  // Context
  country_code: string;
  region_key: string;
  
  // Historical
  historical_acceptance_rate?: number;  // 0-1
  similar_load_avg_rate?: number;
}

// ── DISPATCH PRICING OUTPUT ─────────────────────────────────

export interface DispatchPriceResult {
  // Core pricing
  base_rate_per_mile: number;
  total_base: number;
  
  // Multipliers
  weight_factor: number;
  dimension_factor: number;
  escort_cost: number;
  permit_cost: number;
  urgency_multiplier: number;
  market_multiplier: number;
  complexity_multiplier: number;
  
  // Final
  recommended_price: number;
  price_floor: number;      // minimum to stay profitable
  price_ceiling: number;    // max before losing bids
  
  // Carvana-style bands (from existing engine)
  bands: {
    great_deal: { max: number };
    fair_market: { min: number; max: number };
    premium: { min: number; max: number };
    overpriced: { min: number };
  };
  
  // Label
  currency: string;
  label: PriceLabel;
  
  // Confidence
  confidence: number;       // 0-100
  data_points: number;
  
  // Breakdown (for transparency)
  breakdown: {
    line: string;
    amount: number;
  }[];
}

// ── CONSTANTS ───────────────────────────────────────────────

const WEIGHT_THRESHOLDS = [
  { min: 0,       max: 80000,   factor: 1.00 },
  { min: 80001,   max: 120000,  factor: 1.08 },
  { min: 120001,  max: 200000,  factor: 1.18 },
  { min: 200001,  max: 500000,  factor: 1.35 },
  { min: 500001,  max: Infinity, factor: 1.60 },
];

const DIMENSION_THRESHOLDS = {
  height: [
    { min: 0, max: 14,  factor: 1.00 },
    { min: 14, max: 16, factor: 1.10 },
    { min: 16, max: 18, factor: 1.20 },
    { min: 18, max: Infinity, factor: 1.35 },
  ],
  width: [
    { min: 0, max: 12,  factor: 1.00 },
    { min: 12, max: 16, factor: 1.08 },
    { min: 16, max: 20, factor: 1.18 },
    { min: 20, max: Infinity, factor: 1.30 },
  ],
  length: [
    { min: 0, max: 100,  factor: 1.00 },
    { min: 100, max: 150, factor: 1.05 },
    { min: 150, max: 200, factor: 1.12 },
    { min: 200, max: Infinity, factor: 1.25 },
  ],
};

const URGENCY_MULTIPLIERS = {
  standard: 1.0,
  rush: 1.25,
  emergency: 1.50,
};

const ESCORT_COST_PER_MILE = 1.75;  // baseline per escort per mile
const POLICE_ESCORT_PER_MILE = 3.50;
const PERMIT_COST_PER_STATE = 250;   // average permit cost

// ── CORE ENGINE ─────────────────────────────────────────────

export function calculateDispatchPrice(inputs: DispatchPriceInputs): DispatchPriceResult {
  const breakdown: { line: string; amount: number }[] = [];

  // 1. Get base rate from existing Carvana engine
  const rateType = inputs.superload ? 'height_pole' : 'pevo';
  const priceBandInput: PriceInputs = {
    countryCode: inputs.country_code,
    regionKey: inputs.region_key,
    rateType,
    corridorHeatBand: demandToHeat(inputs.corridor_demand_score),
    complexityModifiers: [
      ...(inputs.superload ? ['superload'] : []),
      ...(inputs.night_move ? ['night_move'] : []),
      ...(inputs.police_required ? ['police_required'] : []),
      ...(inputs.height_ft > 16 ? ['height_pole'] : []),
    ],
  };

  const priceBand = calculatePriceBand(priceBandInput);
  const basePerMile = priceBand
    ? (priceBand.recommendedLow + priceBand.recommendedHigh) / 2
    : 1.85; // fallback

  const totalBase = basePerMile * inputs.distance_miles;
  breakdown.push({ line: `Base rate ($${basePerMile.toFixed(2)}/mi × ${inputs.distance_miles} mi)`, amount: totalBase });

  // 2. Weight complexity
  const weightFactor = getThresholdFactor(inputs.weight_lbs, WEIGHT_THRESHOLDS);
  const weightAdj = totalBase * (weightFactor - 1);
  if (weightAdj > 0) breakdown.push({ line: `Weight surcharge (${inputs.weight_lbs.toLocaleString()} lbs)`, amount: weightAdj });

  // 3. Dimension complexity (take the max)
  const heightFactor = getThresholdFactor(inputs.height_ft, DIMENSION_THRESHOLDS.height);
  const widthFactor = getThresholdFactor(inputs.width_ft, DIMENSION_THRESHOLDS.width);
  const lengthFactor = getThresholdFactor(inputs.length_ft, DIMENSION_THRESHOLDS.length);
  const dimensionFactor = Math.max(heightFactor, widthFactor, lengthFactor);
  const dimensionAdj = totalBase * (dimensionFactor - 1);
  if (dimensionAdj > 0) breakdown.push({ line: `Dimension surcharge`, amount: dimensionAdj });

  // 4. Escort costs
  const escortCost = inputs.escorts_required * ESCORT_COST_PER_MILE * inputs.distance_miles;
  if (escortCost > 0) breakdown.push({ line: `Escort vehicles (${inputs.escorts_required}×)`, amount: escortCost });

  const policeCost = inputs.police_required ? POLICE_ESCORT_PER_MILE * inputs.distance_miles : 0;
  if (policeCost > 0) breakdown.push({ line: `Police escort`, amount: policeCost });

  // 5. Permit costs
  const permitCost = inputs.permits_required * PERMIT_COST_PER_STATE;
  if (permitCost > 0) breakdown.push({ line: `Permits (${inputs.permits_required} states)`, amount: permitCost });

  // 6. Market multiplier (supply vs demand)
  const marketImbalance = (inputs.corridor_demand_score - inputs.operator_supply_score) / 100;
  const marketMultiplier = 1 + (marketImbalance * 0.30);
  
  // 7. Urgency
  const urgencyMultiplier = URGENCY_MULTIPLIERS[inputs.urgency];

  // 8. Acceptance rate adjustment
  let acceptanceAdj = 1.0;
  if (inputs.historical_acceptance_rate !== undefined) {
    if (inputs.historical_acceptance_rate < 0.3) acceptanceAdj = 1.10;   // Low acceptance → raise price
    else if (inputs.historical_acceptance_rate > 0.8) acceptanceAdj = 0.95; // High acceptance → can lower
  }

  // 9. Calculate final
  const subtotal = totalBase * weightFactor * dimensionFactor * marketMultiplier * urgencyMultiplier * acceptanceAdj;
  const finalPrice = subtotal + escortCost + policeCost + permitCost;

  if (urgencyMultiplier > 1) breakdown.push({ line: `${inputs.urgency} urgency`, amount: subtotal * (urgencyMultiplier - 1) });
  if (marketMultiplier > 1.05) breakdown.push({ line: `High demand corridor`, amount: subtotal * (marketMultiplier - 1) });

  // 10. Floor and ceiling
  const floor = finalPrice * 0.80;
  const ceiling = finalPrice * 1.30;

  // 11. Confidence scoring
  let confidence = 50;
  if (priceBand) confidence += 20;
  if (inputs.similar_load_avg_rate) confidence += 15;
  if (inputs.historical_acceptance_rate !== undefined) confidence += 15;

  // Build Carvana-style bands for the final price
  const bands = {
    great_deal: { max: Math.round(finalPrice * 0.85) },
    fair_market: { min: Math.round(finalPrice * 0.85), max: Math.round(finalPrice * 1.10) },
    premium: { min: Math.round(finalPrice * 1.10), max: Math.round(finalPrice * 1.25) },
    overpriced: { min: Math.round(finalPrice * 1.25) },
  };

  const label = finalPrice <= bands.great_deal.max ? 'great_deal' as PriceLabel
    : finalPrice <= bands.fair_market.max ? 'fair_market' as PriceLabel
    : finalPrice <= bands.premium.max ? 'premium' as PriceLabel
    : 'overpriced' as PriceLabel;

  return {
    base_rate_per_mile: basePerMile,
    total_base: totalBase,
    weight_factor: weightFactor,
    dimension_factor: dimensionFactor,
    escort_cost: escortCost + policeCost,
    permit_cost: permitCost,
    urgency_multiplier: urgencyMultiplier,
    market_multiplier: marketMultiplier,
    complexity_multiplier: weightFactor * dimensionFactor,
    recommended_price: Math.round(finalPrice),
    price_floor: Math.round(floor),
    price_ceiling: Math.round(ceiling),
    bands,
    currency: priceBand?.currency || 'USD',
    label,
    confidence: Math.min(100, confidence),
    data_points: inputs.similar_load_avg_rate ? 50 : 10,
    breakdown,
  };
}

// ── LEARNING LOOP ───────────────────────────────────────────

export interface PricingFeedback {
  load_id: string;
  quoted_price: number;
  accepted: boolean;
  final_price?: number;
  operator_feedback?: 'too_low' | 'fair' | 'too_high';
}

export function adjustModelFromFeedback(feedback: PricingFeedback[]): {
  acceptance_rate: number;
  avg_deviation: number;
  recommended_adjustment: number;
} {
  const accepted = feedback.filter(f => f.accepted);
  const rate = accepted.length / feedback.length;
  
  const deviations = accepted
    .filter(f => f.final_price)
    .map(f => (f.final_price! - f.quoted_price) / f.quoted_price);
  
  const avgDeviation = deviations.length > 0
    ? deviations.reduce((s, d) => s + d, 0) / deviations.length
    : 0;

  // If acceptance rate is too low, prices are too high
  // If too high, we're leaving money on the table
  let adjustment = 0;
  if (rate < 0.3) adjustment = -0.05;     // Drop 5%
  else if (rate < 0.5) adjustment = -0.02;
  else if (rate > 0.85) adjustment = 0.05; // Raise 5%
  else if (rate > 0.7) adjustment = 0.02;

  return {
    acceptance_rate: rate,
    avg_deviation: avgDeviation,
    recommended_adjustment: adjustment,
  };
}

// ── HELPERS ─────────────────────────────────────────────────

function demandToHeat(demand: number): 'cold' | 'balanced' | 'warm' | 'hot' | 'critical' {
  if (demand < 20) return 'cold';
  if (demand < 40) return 'balanced';
  if (demand < 60) return 'warm';
  if (demand < 80) return 'hot';
  return 'critical';
}

function getThresholdFactor(value: number, thresholds: { min: number; max: number; factor: number }[]): number {
  for (const t of thresholds) {
    if (value >= t.min && value <= t.max) return t.factor;
  }
  return 1.0;
}
