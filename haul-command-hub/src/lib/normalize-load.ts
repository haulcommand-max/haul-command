/**
 * Haul Command — Standard Load Normalization Layer
 *
 * "Data is not storage. Data is decision advantage + lock-in."
 *
 * All ingested loads (scraped, user-submitted, system-generated) are normalized
 * into this standard_load schema before storage. This enables:
 * - Autonomous matching
 * - AI pricing
 * - Corridor heat mapping
 * - Federal/state compliance checking
 */

export interface StandardLoad {
  // Identity
  id?: string;
  source: 'scraped' | 'user' | 'synthetic' | 'broker' | 'tms';
  sourceId?: string;              // original ID from source system
  ingestedAt?: string;

  // Dimensions (imperial)
  widthFt: number;                // e.g. 14.5
  heightFt: number;               // e.g. 16.0
  lengthFt: number;               // e.g. 85
  weightLbs: number;              // gross weight
  axles?: number;

  // Route
  originState: string;            // US state code e.g. 'TX'
  originCity?: string;
  originCountry: string;          // ISO code e.g. 'US'
  destinationState?: string;
  destinationCity?: string;
  destinationCountry?: string;
  corridorId?: string;            // FK to corridors table
  routeStates?: string[];         // ['TX', 'OK', 'KS'] for multi-state

  // Classification
  isSuperload: boolean;           // true if exceeds superload thresholds
  isHazmat?: boolean;
  loadCategory?: string;          // 'energy', 'construction', 'industrial', 'wind', 'defense'

  // Requirements (computed)
  escortsRequired?: number;
  policeEscortRequired?: boolean;
  permitRequired?: boolean;
  pilotCarFront?: boolean;
  pilotCarRear?: boolean;
  heightPoleRequired?: boolean;

  // Pricing intelligence
  rateEstimateLow?: number;       // USD
  rateEstimateHigh?: number;      // USD
  urgencyScore?: number;          // 0-100, drives price discrimination
  demandScore?: number;           // 0-100, corridor demand

  // Metadata
  moveDate?: string;              // ISO date
  notes?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// ─── Superload thresholds (federal baseline) ──────────────────
const SUPERLOAD_THRESHOLDS = {
  widthFt: 16,
  heightFt: 16,
  lengthFt: 120,
  weightLbs: 200000,
};

// ─── Per-state superload overrides ────────────────────────────
const STATE_SUPERLOAD_OVERRIDES: Record<string, Partial<typeof SUPERLOAD_THRESHOLDS>> = {
  TX: { widthFt: 20, weightLbs: 254300 },
  CA: { widthFt: 14, heightFt: 14, weightLbs: 160000 },
  WA: { widthFt: 16, weightLbs: 180000 },
  OH: { weightLbs: 160000 },
};

// ─── Escort requirement engine ────────────────────────────────
// State-specific rules as a data-driven config (not hardcoded logic)
export const ESCORT_RULES: Record<string, {
  frontEscortWidthFt: number;
  rearEscortWidthFt: number;
  heightPoleHeightFt: number;
  policeWidthFt: number;
  policeWeightLbs?: number;
}> = {
  TX: { frontEscortWidthFt: 14,   rearEscortWidthFt: 14,   heightPoleHeightFt: 14.5, policeWidthFt: 18,   policeWeightLbs: 254300 },
  CA: { frontEscortWidthFt: 12,   rearEscortWidthFt: 12,   heightPoleHeightFt: 14,   policeWidthFt: 16,   policeWeightLbs: 200000 },
  FL: { frontEscortWidthFt: 12.5, rearEscortWidthFt: 12.5, heightPoleHeightFt: 14.5, policeWidthFt: 16 },
  OH: { frontEscortWidthFt: 12,   rearEscortWidthFt: 12,   heightPoleHeightFt: 14.5, policeWidthFt: 16 },
  PA: { frontEscortWidthFt: 12,   rearEscortWidthFt: 12,   heightPoleHeightFt: 13.5, policeWidthFt: 16 },
  GA: { frontEscortWidthFt: 12,   rearEscortWidthFt: 12,   heightPoleHeightFt: 15,   policeWidthFt: 16 },
  WA: { frontEscortWidthFt: 12,   rearEscortWidthFt: 12,   heightPoleHeightFt: 14.5, policeWidthFt: 16 },
};

const DEFAULT_RULES = { frontEscortWidthFt: 12, rearEscortWidthFt: 12, heightPoleHeightFt: 14.5, policeWidthFt: 16 };

// ─── Normalizer function ──────────────────────────────────────
export function normalizeLoad(raw: Partial<StandardLoad>): StandardLoad {
  const width  = raw.widthFt  ?? 0;
  const height = raw.heightFt ?? 0;
  const length = raw.lengthFt ?? 0;
  const weight = raw.weightLbs ?? 0;
  const state  = raw.originState ?? 'TX';

  // Get state-specific superload thresholds
  const stateOverride = STATE_SUPERLOAD_OVERRIDES[state] ?? {};
  const thresholds = { ...SUPERLOAD_THRESHOLDS, ...stateOverride };

  const isSuperload =
    width  >= thresholds.widthFt  ||
    height >= thresholds.heightFt ||
    length >= thresholds.lengthFt ||
    weight >= thresholds.weightLbs;

  // Get escort rules for state
  const rules = ESCORT_RULES[state] ?? DEFAULT_RULES;

  const pilotCarFront   = width >= rules.frontEscortWidthFt;
  const pilotCarRear    = width >= rules.rearEscortWidthFt;
  const heightPoleRequired = height >= rules.heightPoleHeightFt;
  const policeEscortRequired =
    width >= rules.policeWidthFt ||
    weight >= (rules.policeWeightLbs ?? Infinity);

  const escortsRequired =
    (pilotCarFront ? 1 : 0) +
    (pilotCarRear  ? 1 : 0) +
    (heightPoleRequired ? 1 : 0);

  // Urgency score: proximity to move date + superload status
  const daysUntilMove = raw.moveDate
    ? Math.max(0, Math.floor((new Date(raw.moveDate).getTime() - Date.now()) / 86400000))
    : 30;
  const urgencyScore = Math.min(100, Math.round(
    (isSuperload ? 40 : 10) +
    (daysUntilMove < 3  ? 50 : 0) +
    (daysUntilMove < 7  ? 30 : 0) +
    (daysUntilMove < 14 ? 15 : 0)
  ));

  return {
    ...raw,
    id: raw.id,
    source: raw.source ?? 'user',
    widthFt:  width,
    heightFt: height,
    lengthFt: length,
    weightLbs: weight,
    originState: state,
    originCountry: raw.originCountry ?? 'US',
    isSuperload,
    escortsRequired,
    policeEscortRequired,
    permitRequired: true, // any oversize requires a permit
    pilotCarFront,
    pilotCarRear,
    heightPoleRequired,
    urgencyScore,
    demandScore: raw.demandScore ?? 50,
    ingestedAt: raw.ingestedAt ?? new Date().toISOString(),
  };
}

// ─── Rate estimation engine ───────────────────────────────────
// Factors: escorts, police, corridor demand, urgency, superload
export function estimateRate(load: StandardLoad): { low: number; high: number } {
  const base = 400; // base pilot car rate per day
  const escortCost = (load.escortsRequired ?? 0) * base;
  const policeCost = load.policeEscortRequired ? 500 : 0;
  const superloadMult = load.isSuperload ? 2.5 : 1;
  const urgencyMult = 1 + ((load.urgencyScore ?? 0) / 100) * 0.5; // up to 50% urgency premium
  const demandMult = 1 + ((load.demandScore ?? 50) / 100) * 0.3;  // up to 30% demand premium

  const low  = Math.round((escortCost + policeCost) * superloadMult * 0.8);
  const high = Math.round((escortCost + policeCost) * superloadMult * urgencyMult * demandMult * 1.4);

  return { low, high };
}
