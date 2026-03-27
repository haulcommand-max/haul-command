/**
 * Haul Command — Pricing Intelligence Engine
 * 
 * Canonical rate schedules for all escort/PEVO service types across US & Canada.
 * Extracted from the 2026 Oversized Load Support Rate Guide.
 * 
 * RULES:
 *  - Always use RANGES, never fixed numbers
 *  - Price the FULL JOB, not just miles
 *  - Account for complexity, risk, time, and operational constraints
 *  - Prevent underpricing and highlight missed revenue
 *  - Profitability > Competitiveness
 */

// ─── Region Definitions ──────────────────────────────────────
export type Region = 'southeast' | 'midwest' | 'northeast' | 'southwest' | 'west_coast' | 'canada';

export const REGION_LABELS: Record<Region, string> = {
  southeast: 'Southeast US',
  midwest: 'Midwest US',
  northeast: 'Northeast US',
  southwest: 'Southwest US',
  west_coast: 'West Coast US',
  canada: 'Canada',
};

// US state → region mapping
export const STATE_REGION_MAP: Record<string, Region> = {
  // Southeast
  AL: 'southeast', AR: 'southeast', FL: 'southeast', GA: 'southeast',
  KY: 'southeast', LA: 'southeast', MS: 'southeast', NC: 'southeast',
  SC: 'southeast', TN: 'southeast', VA: 'southeast', WV: 'southeast',
  // Midwest
  IA: 'midwest', IL: 'midwest', IN: 'midwest', KS: 'midwest',
  MI: 'midwest', MN: 'midwest', MO: 'midwest', NE: 'midwest',
  ND: 'midwest', OH: 'midwest', OK: 'midwest', SD: 'midwest',
  WI: 'midwest',
  // Northeast
  CT: 'northeast', DC: 'northeast', DE: 'northeast', MA: 'northeast',
  MD: 'northeast', ME: 'northeast', NH: 'northeast', NJ: 'northeast',
  NY: 'northeast', PA: 'northeast', RI: 'northeast', VT: 'northeast',
  // Southwest
  AZ: 'southwest', CO: 'southwest', NM: 'southwest', NV: 'southwest',
  TX: 'southwest', UT: 'southwest',
  // West Coast
  CA: 'west_coast', HI: 'west_coast', OR: 'west_coast', WA: 'west_coast',
  // Outliers mapped to nearest
  AK: 'west_coast', ID: 'west_coast', MT: 'midwest', WY: 'southwest',
};

// Canadian province → region
export const PROVINCE_REGION_MAP: Record<string, Region> = {
  AB: 'canada', BC: 'canada', MB: 'canada', NB: 'canada',
  NL: 'canada', NS: 'canada', NT: 'canada', NU: 'canada',
  ON: 'canada', PE: 'canada', QC: 'canada', SK: 'canada', YT: 'canada',
};

// ─── Service Types ───────────────────────────────────────────
export type ServiceType =
  | 'lead_chase'       // Base PEVO escort
  | 'height_pole'      // Height pole / specialized escort
  | 'bucket_truck'     // Utility / line lift
  | 'route_survey'     // Engineering route survey
  | 'police_escort'    // State & local police
  ;

export const SERVICE_LABELS: Record<ServiceType, string> = {
  lead_chase: 'Lead/Chase Escort (PEVO)',
  height_pole: 'Height Pole & Specialized Escort',
  bucket_truck: 'Bucket Truck (Utility/Line Lift)',
  route_survey: 'Route Survey (Engineering)',
  police_escort: 'Police Escort (State & Local)',
};

// ─── Rate Range Type ─────────────────────────────────────────
export interface RateRange {
  low: number;
  high: number;
  unit: 'per_mile' | 'per_day' | 'per_hour' | 'flat' | 'per_job';
}

// ─── Core Rate Schedules ─────────────────────────────────────

/** 1. BASE ESCORT — LEAD / CHASE (PEVO) */
export const LEAD_CHASE_RATES: Record<Region, { perMile: RateRange; dayRate: RateRange }> = {
  southeast:  { perMile: { low: 1.65, high: 1.85, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
  midwest:    { perMile: { low: 1.75, high: 1.95, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
  northeast:  { perMile: { low: 1.80, high: 2.00, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
  southwest:  { perMile: { low: 1.85, high: 2.00, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
  west_coast: { perMile: { low: 2.00, high: 2.25, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
  canada:     { perMile: { low: 2.00, high: 2.25, unit: 'per_mile' }, dayRate: { low: 450, high: 650, unit: 'per_day' } },
};

/** Mini / short move minimum */
export const SHORT_MOVE_MIN: RateRange = { low: 350, high: 500, unit: 'flat' };

/** 2. HEIGHT POLE & SPECIALIZED ESCORT */
export const HEIGHT_POLE_RATES: Record<Region, { perMile: RateRange; dayRate: RateRange }> = {
  southeast:  { perMile: { low: 1.90, high: 2.20, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
  midwest:    { perMile: { low: 2.00, high: 2.50, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
  northeast:  { perMile: { low: 2.00, high: 2.50, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
  southwest:  { perMile: { low: 2.00, high: 2.50, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
  west_coast: { perMile: { low: 2.25, high: 2.75, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
  canada:     { perMile: { low: 2.25, high: 2.75, unit: 'per_mile' }, dayRate: { low: 550, high: 800, unit: 'per_day' } },
};

/** 3. BUCKET TRUCK (UTILITY / LINE LIFT) */
export const BUCKET_TRUCK_RATES: Record<Region, { perMile: RateRange; hourly: RateRange; dayRate: RateRange }> = {
  southeast:  { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 150, high: 225, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
  midwest:    { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 175, high: 250, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
  northeast:  { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 175, high: 250, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
  southwest:  { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 175, high: 250, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
  west_coast: { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 200, high: 275, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
  canada:     { perMile: { low: 2.25, high: 3.50, unit: 'per_mile' }, hourly: { low: 200, high: 275, unit: 'per_hour' }, dayRate: { low: 1200, high: 1800, unit: 'per_day' } },
};

/** 4. ROUTE SURVEY (ENGINEERING) — distance-tiered */
export type DistanceTier = '0-100' | '101-300' | '301-500' | '500+';

export const ROUTE_SURVEY_RATES: Record<Region, Record<DistanceTier, RateRange>> = {
  southeast: {
    '0-100':   { low: 550,  high: 850,  unit: 'per_job' },
    '101-300': { low: 550,  high: 850,  unit: 'per_job' },
    '301-500': { low: 550,  high: 850,  unit: 'per_job' },
    '500+':    { low: 550,  high: 850,  unit: 'per_job' },
  },
  midwest: {
    '0-100':   { low: 600,  high: 950,  unit: 'per_job' },
    '101-300': { low: 600,  high: 950,  unit: 'per_job' },
    '301-500': { low: 600,  high: 950,  unit: 'per_job' },
    '500+':    { low: 600,  high: 950,  unit: 'per_job' },
  },
  northeast: {
    '0-100':   { low: 600,  high: 950,  unit: 'per_job' },
    '101-300': { low: 600,  high: 950,  unit: 'per_job' },
    '301-500': { low: 600,  high: 950,  unit: 'per_job' },
    '500+':    { low: 600,  high: 950,  unit: 'per_job' },
  },
  southwest: {
    '0-100':   { low: 600,  high: 950,  unit: 'per_job' },
    '101-300': { low: 600,  high: 950,  unit: 'per_job' },
    '301-500': { low: 600,  high: 950,  unit: 'per_job' },
    '500+':    { low: 600,  high: 950,  unit: 'per_job' },
  },
  west_coast: {
    '0-100':   { low: 700,  high: 1200, unit: 'per_job' },
    '101-300': { low: 700,  high: 1200, unit: 'per_job' },
    '301-500': { low: 700,  high: 1200, unit: 'per_job' },
    '500+':    { low: 700,  high: 1200, unit: 'per_job' },
  },
  canada: {
    '0-100':   { low: 700,  high: 1200, unit: 'per_job' },
    '101-300': { low: 700,  high: 1200, unit: 'per_job' },
    '301-500': { low: 700,  high: 1200, unit: 'per_job' },
    '500+':    { low: 700,  high: 1200, unit: 'per_job' },
  },
};

/** 5. POLICE ESCORTS */
export const POLICE_ESCORT_RATES = {
  state: {
    hourly: 31,     // $31/hr
    perMile: 0.044, // $0.044/mi
  },
  local_municipal: {
    hourly: { low: 50, high: 100, unit: 'per_hour' as const },
  },
  widthThresholdFt: 17, // typically required for loads over 17' wide
};

// ─── Premiums & Adjustments ──────────────────────────────────

export const EQUIPMENT_PREMIUMS = {
  /** Advanced visibility & safety setup */
  advanced_per_mile: { low: 0.10, high: 0.25 },
  advanced_per_day:  { low: 50, high: 100 },
};

export const COMPLEXITY_PREMIUMS = {
  /** Urban / tight turns / utility-heavy corridors */
  urban_per_day: { low: 100, high: 300 },
  /** Super-wide / very slow loads */
  superwide_per_mile: { low: 0.25, high: 0.50 },
};

export const TIME_PREMIUMS = {
  /** Wait time / detention — after 30-60 min free */
  detention_per_hour: { low: 50, high: 75 },
  /** Night moves */
  night_per_mile: { low: 0.25, high: 0.50 },
  night_per_day:  { low: 100, high: 150 },
  /** Weekend */
  weekend_flat: { low: 75, high: 150 },
  /** Holidays */
  holiday_flat: { low: 150, high: 300 },
  /** After-hours multiplier */
  after_hours_multiplier: 1.25,
};

export const MULTI_DAY = {
  /** Layover day */
  layover_per_day:  { low: 300, high: 500 },
  /** Cancelled after dispatch */
  cancel_flat:      { low: 250, high: 400 },
};

export const DEADHEAD = {
  /** Deadhead repositioning */
  per_mile: { low: 0.75, high: 1.25 },
};

export const METRO_PREMIUM = {
  /** High-traffic zone surcharge */
  flat: { low: 75, high: 200 },
};

export const HOTEL_GUIDELINES = {
  southeast_midwest:     { low: 85,  high: 120 },
  northeast_west_coast:  { low: 120, high: 180 },
};

export const PAYMENT_TERMS = {
  /** Net-30 / Net-45 admin risk buffer */
  net30_buffer: { low: 50, high: 100 },
};

export const OPTIONAL_COST_FACTORS = {
  urban_coordination: { low: 100, high: 300 },
  standby_per_hour:   { low: 75,  high: 125 },
  /** Weekend/Seasonal addon */
  seasonal_pct:       { low: 10,  high: 25 },
  /** Multi-agency coordination */
  multi_agency_flat:  { low: 500, high: 1500 },
};

// ─── Hidden Costs Operators Forget ───────────────────────────
export const HIDDEN_COSTS = [
  'Tire & Suspension Wear',
  'Insurance Increases',
  'Downtime Between Jobs',
  'Equipment Maintenance',
  'Tolls & Bridge Fees',
  'Parking & Staging Costs',
  'Communication Equipment (radios, cells)',
  'CDL/Certification Renewal',
] as const;

// ─── Fuel Surcharge Calculator ───────────────────────────────
export const FUEL_SURCHARGE = {
  /** DOE national avg diesel baseline (updated for 2026) */
  baselineDieselPerGallon: 3.50,
  /** Operator avg MPG for escort vehicles */
  avgMpg: 14,
  /** Formula: ((currentDiesel - baseline) / avgMpg) * distance */
  calculate: (currentDieselPrice: number, distanceMiles: number) => {
    if (currentDieselPrice <= 3.50) return 0;
    return Math.round(((currentDieselPrice - 3.50) / 14) * distanceMiles * 100) / 100;
  },
};

// ─── Permit Cost Estimation by State ─────────────────────────
export const PERMIT_COST_ESTIMATES: Record<string, { singleTrip: RateRange; annual: RateRange; superload: RateRange }> = {
  TX: { singleTrip: { low: 60,   high: 120,  unit: 'flat' }, annual: { low: 500,  high: 1200, unit: 'flat' }, superload: { low: 500,  high: 2500, unit: 'flat' } },
  CA: { singleTrip: { low: 90,   high: 180,  unit: 'flat' }, annual: { low: 800,  high: 1500, unit: 'flat' }, superload: { low: 800,  high: 5000, unit: 'flat' } },
  FL: { singleTrip: { low: 50,   high: 100,  unit: 'flat' }, annual: { low: 400,  high: 1000, unit: 'flat' }, superload: { low: 400,  high: 2000, unit: 'flat' } },
  NY: { singleTrip: { low: 75,   high: 150,  unit: 'flat' }, annual: { low: 600,  high: 1300, unit: 'flat' }, superload: { low: 600,  high: 3000, unit: 'flat' } },
  PA: { singleTrip: { low: 50,   high: 100,  unit: 'flat' }, annual: { low: 400,  high: 1000, unit: 'flat' }, superload: { low: 500,  high: 2500, unit: 'flat' } },
  IL: { singleTrip: { low: 50,   high: 100,  unit: 'flat' }, annual: { low: 400,  high: 900,  unit: 'flat' }, superload: { low: 400,  high: 2000, unit: 'flat' } },
  OH: { singleTrip: { low: 40,   high: 80,   unit: 'flat' }, annual: { low: 350,  high: 800,  unit: 'flat' }, superload: { low: 350,  high: 1800, unit: 'flat' } },
  GA: { singleTrip: { low: 40,   high: 80,   unit: 'flat' }, annual: { low: 300,  high: 700,  unit: 'flat' }, superload: { low: 350,  high: 1500, unit: 'flat' } },
  WA: { singleTrip: { low: 60,   high: 120,  unit: 'flat' }, annual: { low: 500,  high: 1100, unit: 'flat' }, superload: { low: 600,  high: 3000, unit: 'flat' } },
  OR: { singleTrip: { low: 50,   high: 100,  unit: 'flat' }, annual: { low: 400,  high: 900,  unit: 'flat' }, superload: { low: 500,  high: 2500, unit: 'flat' } },
  DEFAULT: { singleTrip: { low: 50, high: 120, unit: 'flat' }, annual: { low: 400, high: 1000, unit: 'flat' }, superload: { low: 400, high: 2500, unit: 'flat' } },
};

// ─── Convoy / Multi-Truck Pricing ────────────────────────────
export const CONVOY_PRICING = {
  /** Discount for 2nd+ escort on same job (bundled) */
  additionalEscortDiscount: 0.10, // 10% off per-mile rate
  /** Minimum convoy surcharge (coordination overhead) */
  coordinationFee: { low: 100, high: 250 },
  /** Max vehicles in a single convoy */
  maxConvoySize: 5,
};

// ─── Emergency / Rush Premium ────────────────────────────────
export const RUSH_PREMIUMS = {
  /** Same-day dispatch (under 4 hrs notice) */
  sameDay: { multiplier: 1.75, label: 'Same-Day Rush (1.75x)' },
  /** Next-day dispatch */
  nextDay: { multiplier: 1.35, label: 'Next-Day Rush (1.35x)' },
  /** Standard booking (48+ hrs) */
  standard: { multiplier: 1.0, label: 'Standard Booking' },
};

// ─── Cross-Border Premiums ───────────────────────────────────
export const CROSS_BORDER = {
  us_canada: {
    flat: { low: 200, high: 500 },
    notes: 'Includes customs staging time, CBSA/CBP coordination, bond fees, and documentation.',
  },
  us_mexico: {
    flat: { low: 300, high: 750 },
    notes: 'Includes broker fees, cartage transfer, customs clearance, and security escort coordination.',
  },
};

// ─── Mountain Pass / Elevation Premium ───────────────────────
export const MOUNTAIN_PASS_PREMIUM = {
  /** Routes through major mountain corridors */
  perMileAddon: { low: 0.15, high: 0.40 },
  /** Named high-risk corridors */
  corridors: [
    { name: 'I-70 Eisenhower Tunnel (CO)', premium: 200 },
    { name: 'Donner Pass / I-80 (CA/NV)', premium: 250 },
    { name: 'Snoqualmie Pass / I-90 (WA)', premium: 150 },
    { name: 'Tehachapi Pass (CA)', premium: 150 },
    { name: 'Grapevine / I-5 Tejon Pass (CA)', premium: 175 },
    { name: 'I-15 Cajon Pass (CA)', premium: 150 },
    { name: 'I-40 Flagstaff (AZ)', premium: 125 },
    { name: 'I-81 Appalachian Corridor (VA/WV/PA)', premium: 100 },
    { name: 'I-26 Blue Ridge (NC/TN)', premium: 100 },
    { name: 'Trans-Canada Hwy (Rogers/Kicking Horse)', premium: 300 },
  ],
};

// ─── Seasonal Demand Multipliers ─────────────────────────────
export type Season = 'peak_construction' | 'storm_recovery' | 'standard' | 'slow';

export const SEASONAL_MULTIPLIERS: Record<Season, { multiplier: number; label: string; months: string }> = {
  peak_construction: { multiplier: 1.20, label: 'Peak Construction Season (+20%)', months: 'Apr–Oct' },
  storm_recovery:    { multiplier: 1.40, label: 'Storm Recovery Surge (+40%)', months: 'Variable (hurricane/tornado/ice)' },
  standard:          { multiplier: 1.00, label: 'Standard Season', months: 'Nov–Mar (no events)' },
  slow:              { multiplier: 0.95, label: 'Post-Holiday Slow (-5%)', months: 'Late Dec–Early Feb' },
};

// ─── Toll & Bridge Fee Passthrough ───────────────────────────
export const TOLL_ESTIMATES: Record<string, number> = {
  /** Estimated toll costs for common oversize corridors (one-way) */
  'NJ Turnpike (Full)': 45,
  'PA Turnpike (Full)': 65,
  'OH Turnpike (Full)': 30,
  'IN Toll Road (Full)': 20,
  'IL Tollway (Chicago bypass)': 35,
  'NY Thruway (Full)': 50,
  'FL Turnpike (Full)': 30,
  'TX SH 130 (Full)': 15,
  'Mackinac Bridge (MI)': 10,
  'Chesapeake Bay Bridge-Tunnel (VA)': 30,
  'George Washington Bridge (NY/NJ)': 35,
  'Golden Gate Bridge (CA)': 10,
  'Bay Bridge (CA)': 8,
  '407 ETR (ON, Canada)': 40,
};

// ─── Service Position Catalog (US + Canada + 120 countries) ───

export type PositionCode =
  | 'lead_car'
  | 'chase_car'
  | 'height_pole'
  | 'bucket_truck'
  | 'route_survey'
  | 'state_police'
  | 'local_police'
  | 'flagger'
  | 'signage'
  | 'drone_survey'
  | 'steerman'
  | 'permit_runner'
  | 'utility_coordinator'
  | 'railroad_flagman'
  | 'safety_officer'
  | 'water_escort'
  | 'crane_operator'
  | 'military_escort'
  ;

export interface Position {
  code: PositionCode;
  label: string;
  description: string;
  /** Countries where this position is applicable */
  countries: string[];
}

export const POSITIONS: Position[] = [
  { code: 'lead_car',     label: 'Lead Car (Front Escort)',     description: 'Pilot vehicle ahead of the load warning oncoming traffic and checking clearances.',                                     countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'BR', 'MX', 'ZA', 'NZ', 'IN', 'JP', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'MK', 'AL', 'GR', 'TR', 'IE', 'PT', 'LT', 'LV', 'EE', 'LU', 'CY', 'MT', 'IS', 'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'KE', 'NG', 'CL', 'AR', 'CO'] },
  { code: 'chase_car',    label: 'Chase Car (Rear Escort)',     description: 'Pilot vehicle behind the load providing rear traffic protection.',                                                        countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'BR', 'MX', 'ZA', 'NZ', 'IN', 'JP', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'RS', 'BA', 'ME', 'MK', 'AL', 'GR', 'TR', 'IE', 'PT', 'LT', 'LV', 'EE', 'LU', 'CY', 'MT', 'IS', 'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'KE', 'NG', 'CL', 'AR', 'CO'] },
  { code: 'height_pole',  label: 'Height Pole Operator',        description: 'Operates a height pole vehicle to measure overhead clearances for tall loads.',                                          countries: ['US', 'CA', 'AU', 'GB', 'DE', 'NZ', 'FR', 'NL', 'BE'] },
  { code: 'bucket_truck', label: 'Bucket Truck (Utility/Line Lift)', description: 'Lifts utility wires and cables for overheight loads moving through urban corridors.',                               countries: ['US', 'CA'] },
  { code: 'route_survey', label: 'Route Survey Engineer',       description: 'Pre-surveys the intended route for height, weight, width, and turn clearances.',                                        countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'BR', 'MX', 'ZA', 'NZ', 'JP', 'IN'] },
  { code: 'state_police', label: 'State Police Escort',         description: 'State trooper or highway patrol escort for oversize loads exceeding state thresholds.',                                  countries: ['US'] },
  { code: 'local_police', label: 'Local/Municipal Police Escort', description: 'City or county police escort required for oversize loads through municipal jurisdictions.',                            countries: ['US', 'CA'] },
  { code: 'flagger',      label: 'Flagger / Traffic Control',   description: 'Certified flagger providing traffic control at intersections, construction zones, and tight turns.',                     countries: ['US', 'CA', 'AU', 'NZ', 'GB'] },
  { code: 'signage',      label: 'Sign Truck / Attenuator',     description: 'Truck-mounted attenuator (TMA) or changeable message sign providing highway-level traffic management.',                 countries: ['US', 'CA', 'AU', 'GB', 'DE'] },
  { code: 'drone_survey', label: 'Drone Route Survey',          description: 'Aerial drone inspection of bridges, overpasses, and tight clearance points before a move.',                              countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'NZ'] },
  { code: 'steerman',      label: 'Steerman / Rear Steer Operator', description: 'Operates the rear steering on multi-axle, long-combination trailers for navigating turns and tight spaces.',           countries: ['US', 'CA', 'AU', 'DE', 'NL', 'BE', 'GB'] },
  { code: 'permit_runner', label: 'Permit Runner / Expediter',  description: 'Procures oversize/overweight permits from state DOTs and manages regulatory paperwork.',                                 countries: ['US', 'CA'] },
  { code: 'utility_coordinator', label: 'Utility Coordinator',   description: 'Coordinates with electric, telephone, and cable companies to lift or relocate utility lines along the route.',           countries: ['US', 'CA'] },
  { code: 'railroad_flagman', label: 'Railroad Flagman',         description: 'Coordinates with railroads to flag and manage rail crossing windows for oversize loads.',                                 countries: ['US', 'CA', 'AU'] },
  { code: 'safety_officer', label: 'Safety Officer / Spotter',  description: 'On-site safety management for superloads, providing real-time hazard identification and crew coordination.',              countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'NZ', 'ZA', 'BR'] },
  { code: 'water_escort',  label: 'Water Escort / Barge Pilot', description: 'Provides escort or piloting services for loads requiring waterway crossings or barge transport.',                       countries: ['US', 'CA', 'AU', 'NL', 'DE', 'BR'] },
  { code: 'crane_operator', label: 'Crane Operator (Load Assembly)', description: 'Operates cranes for assembly/disassembly of superloads at origin and destination.',                                 countries: ['US', 'CA', 'AU', 'GB', 'DE', 'FR', 'SA', 'AE', 'JP', 'BR', 'MX', 'IN'] },
  { code: 'military_escort', label: 'Military / Government Escort', description: 'Government or military personnel providing armed escort for high-security or defense-related oversize cargo.',     countries: ['US', 'CA', 'AU', 'GB', 'FR', 'DE', 'SA', 'AE', 'IN', 'TR', 'BR'] },
];

// ─── International Position Extensions (120 countries) ────────
// These are additional escort/support positions found in specific international markets

export const INTERNATIONAL_POSITIONS: Position[] = [
  { code: 'lead_car',     label: 'Begleitfahrzeug (Escort Vehicle)',  description: 'BF3-certified escort vehicle required for oversize transport in Germany.',                          countries: ['DE', 'AT', 'CH'] },
  { code: 'lead_car',     label: 'Voertuig Begeleiding',             description: 'Escort vehicle for exceptional transport in the Netherlands and Belgium.',                              countries: ['NL', 'BE', 'LU'] },
  { code: 'lead_car',     label: 'Véhicule Pilote',                  description: 'Pilot vehicle for convoi exceptionnel (abnormal loads) in France.',                                     countries: ['FR'] },
  { code: 'lead_car',     label: 'Batedor / Escolta',                description: 'Escort vehicle for carga especial (special loads) in Brazil and Latin America.',                        countries: ['BR', 'AR', 'CL', 'CO', 'MX'] },
  { code: 'lead_car',     label: 'Pilot Vehicle',                    description: 'Certified pilot vehicle operator per NHVR or state authority requirements.',                            countries: ['AU', 'NZ'] },
  { code: 'lead_car',     label: 'Abnormal Load Escort',             description: 'Escort vehicle for abnormal loads on UK roads, operating under STGO regulations.',                      countries: ['GB', 'IE'] },
  { code: 'state_police', label: 'Traffic Police Escort',            description: 'Government traffic police escort required for oversize loads in Gulf states.',                           countries: ['SA', 'AE', 'QA', 'KW', 'OM', 'BH'] },
  { code: 'state_police', label: 'Gendarmerie / Police Escort',      description: 'Police escort for oversize loads on national highways.',                                                 countries: ['FR', 'TR', 'IN'] },
  { code: 'steerman',      label: 'Nachlauflenker/Schwerlastbegleitung', description: 'Rear steer operator for Schwertransport (heavy transport) on German roads.',                            countries: ['DE', 'AT', 'CH'] },
  { code: 'military_escort', label: 'Escolta Militar',                   description: 'Military convoy escort for restricted defense cargo in Latin America.',                                  countries: ['BR', 'MX', 'CO', 'AR', 'CL'] },
  { code: 'water_escort',  label: 'Waterschip / Pontonniers',           description: 'Barge and pontoon ferry coordination for loads crossing rivers and canals.',                              countries: ['NL', 'BE', 'DE'] },
  { code: 'safety_officer', label: 'Transportbegleiter (Transport Escort)', description: 'Certified transport escort officer meeting BF4 or higher qualification.',                             countries: ['DE', 'AT', 'CH', 'PL', 'CZ'] },
  { code: 'railroad_flagman', label: 'Rail Crossing Coordinator',       description: 'Coordinates with national rail authorities for level crossing windows.',                                  countries: ['AU', 'NZ', 'IN', 'ZA'] },
];

// ─── Pricing Calculator Helper ───────────────────────────────

export interface PricingInput {
  serviceType: ServiceType;
  region: Region;
  distanceMiles: number;
  daysEstimate?: number;
  isNightMove?: boolean;
  isWeekend?: boolean;
  isHoliday?: boolean;
  isUrban?: boolean;
  isSuperwide?: boolean;
  hasAdvancedEquipment?: boolean;
  deadheadMiles?: number;
  waitHours?: number;
  paymentTerms?: 'cod' | 'net30' | 'net45';
  /** New fields */
  rushLevel?: 'sameDay' | 'nextDay' | 'standard';
  season?: Season;
  isCrossBorder?: 'us_canada' | 'us_mexico' | false;
  isMountainPass?: boolean;
  currentDieselPrice?: number;
  numEscorts?: number; // for convoy pricing
  stateCode?: string;  // for permit estimation
}

export interface PricingOutput {
  low: number;
  mid: number;
  high: number;
  lineItems: { label: string; low: number; high: number }[];
  warnings: string[];
  upsells: string[];
}

export function calculateEstimate(input: PricingInput): PricingOutput {
  const items: { label: string; low: number; high: number }[] = [];
  const warnings: string[] = [];
  const upsells: string[] = [];
  let totalLow = 0;
  let totalHigh = 0;

  const {
    serviceType, region, distanceMiles,
    daysEstimate = 1,
    isNightMove = false,
    isWeekend = false,
    isHoliday = false,
    isUrban = false,
    isSuperwide = false,
    hasAdvancedEquipment = false,
    deadheadMiles = 0,
    waitHours = 0,
    paymentTerms = 'cod',
    rushLevel = 'standard',
    season = 'standard',
    isCrossBorder = false,
    isMountainPass = false,
    currentDieselPrice = 0,
    numEscorts = 1,
    stateCode,
  } = input;

  // ── Base rate ──────────────────────────────────────────────
  if (serviceType === 'lead_chase') {
    const r = LEAD_CHASE_RATES[region];
    if (distanceMiles < 100) {
      items.push({ label: 'Short Move Minimum', low: SHORT_MOVE_MIN.low, high: SHORT_MOVE_MIN.high });
      totalLow += SHORT_MOVE_MIN.low;
      totalHigh += SHORT_MOVE_MIN.high;
    } else {
      const lo = distanceMiles * r.perMile.low;
      const hi = distanceMiles * r.perMile.high;
      items.push({ label: `Lead/Chase ${distanceMiles} mi @ $${r.perMile.low}–$${r.perMile.high}/mi`, low: lo, high: hi });
      totalLow += lo;
      totalHigh += hi;
    }
  } else if (serviceType === 'height_pole') {
    const r = HEIGHT_POLE_RATES[region];
    const lo = Math.max(distanceMiles * r.perMile.low, r.dayRate.low * daysEstimate);
    const hi = Math.max(distanceMiles * r.perMile.high, r.dayRate.high * daysEstimate);
    items.push({ label: `Height Pole ${distanceMiles} mi`, low: lo, high: hi });
    totalLow += lo;
    totalHigh += hi;
  } else if (serviceType === 'bucket_truck') {
    const r = BUCKET_TRUCK_RATES[region];
    const lo = r.dayRate.low * daysEstimate;
    const hi = r.dayRate.high * daysEstimate;
    items.push({ label: `Bucket Truck ${daysEstimate} day(s)`, low: lo, high: hi });
    totalLow += lo;
    totalHigh += hi;
    upsells.push('Mobilization fee may apply');
  } else if (serviceType === 'route_survey') {
    const tier: DistanceTier = distanceMiles <= 100 ? '0-100' : distanceMiles <= 300 ? '101-300' : distanceMiles <= 500 ? '301-500' : '500+';
    const r = ROUTE_SURVEY_RATES[region][tier];
    items.push({ label: `Route Survey (${tier} mi tier)`, low: r.low, high: r.high });
    totalLow += r.low;
    totalHigh += r.high;
  } else if (serviceType === 'police_escort') {
    const stateEst = POLICE_ESCORT_RATES.state.hourly * 8 + POLICE_ESCORT_RATES.state.perMile * distanceMiles;
    const localLo = POLICE_ESCORT_RATES.local_municipal.hourly.low * 4;
    const localHi = POLICE_ESCORT_RATES.local_municipal.hourly.high * 4;
    items.push({ label: 'Police Escort (est.)', low: Math.min(stateEst, localLo), high: Math.max(stateEst, localHi) });
    totalLow += Math.min(stateEst, localLo);
    totalHigh += Math.max(stateEst, localHi);
  }

  // ── Premiums ───────────────────────────────────────────────
  if (isNightMove) {
    const lo = distanceMiles * TIME_PREMIUMS.night_per_mile.low;
    const hi = distanceMiles * TIME_PREMIUMS.night_per_mile.high;
    items.push({ label: 'Night Move Premium', low: lo, high: hi });
    totalLow += lo; totalHigh += hi;
  }
  if (isWeekend) {
    items.push({ label: 'Weekend Premium', low: TIME_PREMIUMS.weekend_flat.low, high: TIME_PREMIUMS.weekend_flat.high });
    totalLow += TIME_PREMIUMS.weekend_flat.low; totalHigh += TIME_PREMIUMS.weekend_flat.high;
  }
  if (isHoliday) {
    items.push({ label: 'Holiday Premium', low: TIME_PREMIUMS.holiday_flat.low, high: TIME_PREMIUMS.holiday_flat.high });
    totalLow += TIME_PREMIUMS.holiday_flat.low; totalHigh += TIME_PREMIUMS.holiday_flat.high;
  }
  if (isUrban) {
    items.push({ label: 'Urban/Metro Surcharge', low: METRO_PREMIUM.flat.low, high: METRO_PREMIUM.flat.high });
    totalLow += METRO_PREMIUM.flat.low; totalHigh += METRO_PREMIUM.flat.high;
  }
  if (isSuperwide) {
    const lo = distanceMiles * COMPLEXITY_PREMIUMS.superwide_per_mile.low;
    const hi = distanceMiles * COMPLEXITY_PREMIUMS.superwide_per_mile.high;
    items.push({ label: 'Super-Wide Load Premium', low: lo, high: hi });
    totalLow += lo; totalHigh += hi;
  }
  if (hasAdvancedEquipment) {
    const lo = distanceMiles * EQUIPMENT_PREMIUMS.advanced_per_mile.low;
    const hi = distanceMiles * EQUIPMENT_PREMIUMS.advanced_per_mile.high;
    items.push({ label: 'Advanced Equipment Addon', low: lo, high: hi });
    totalLow += lo; totalHigh += hi;
  }
  if (deadheadMiles > 0) {
    const lo = deadheadMiles * DEADHEAD.per_mile.low;
    const hi = deadheadMiles * DEADHEAD.per_mile.high;
    items.push({ label: `Deadhead ${deadheadMiles} mi`, low: lo, high: hi });
    totalLow += lo; totalHigh += hi;
    warnings.push('Unpaid deadhead = profit loss. Always quote deadhead.');
  }
  if (waitHours > 0) {
    const lo = waitHours * TIME_PREMIUMS.detention_per_hour.low;
    const hi = waitHours * TIME_PREMIUMS.detention_per_hour.high;
    items.push({ label: `Detention ${waitHours} hrs`, low: lo, high: hi });
    totalLow += lo; totalHigh += hi;
  }
  if (paymentTerms === 'net30' || paymentTerms === 'net45') {
    items.push({ label: `${paymentTerms.toUpperCase()} Admin Buffer`, low: PAYMENT_TERMS.net30_buffer.low, high: PAYMENT_TERMS.net30_buffer.high });
    totalLow += PAYMENT_TERMS.net30_buffer.low; totalHigh += PAYMENT_TERMS.net30_buffer.high;
  }

  // ── NEW: Rush premium ──────────────────────────────────────
  if (rushLevel !== 'standard') {
    const rush = RUSH_PREMIUMS[rushLevel];
    const rushLo = totalLow * (rush.multiplier - 1);
    const rushHi = totalHigh * (rush.multiplier - 1);
    items.push({ label: rush.label, low: Math.round(rushLo), high: Math.round(rushHi) });
    totalLow += rushLo; totalHigh += rushHi;
  }

  // ── NEW: Seasonal multiplier ───────────────────────────────
  if (season !== 'standard') {
    const s = SEASONAL_MULTIPLIERS[season];
    const sLo = totalLow * (s.multiplier - 1);
    const sHi = totalHigh * (s.multiplier - 1);
    items.push({ label: s.label, low: Math.round(sLo), high: Math.round(sHi) });
    totalLow += sLo; totalHigh += sHi;
  }

  // ── NEW: Cross-border ──────────────────────────────────────
  if (isCrossBorder) {
    const cb = CROSS_BORDER[isCrossBorder];
    items.push({ label: `Cross-Border (${isCrossBorder.replace('_', '↔').toUpperCase()})`, low: cb.flat.low, high: cb.flat.high });
    totalLow += cb.flat.low; totalHigh += cb.flat.high;
    upsells.push(cb.notes);
  }

  // ── NEW: Mountain pass ─────────────────────────────────────
  if (isMountainPass) {
    const lo = distanceMiles * MOUNTAIN_PASS_PREMIUM.perMileAddon.low;
    const hi = distanceMiles * MOUNTAIN_PASS_PREMIUM.perMileAddon.high;
    items.push({ label: 'Mountain Pass Premium', low: Math.round(lo), high: Math.round(hi) });
    totalLow += lo; totalHigh += hi;
  }

  // ── NEW: Fuel surcharge ────────────────────────────────────
  if (currentDieselPrice > 0) {
    const fsc = FUEL_SURCHARGE.calculate(currentDieselPrice, distanceMiles);
    if (fsc > 0) {
      items.push({ label: `Fuel Surcharge ($${currentDieselPrice}/gal)`, low: fsc, high: fsc });
      totalLow += fsc; totalHigh += fsc;
    }
  }

  // ── NEW: Convoy multiplier ─────────────────────────────────
  if (numEscorts > 1) {
    const escortCount = Math.min(numEscorts, CONVOY_PRICING.maxConvoySize);
    const additionalCost = (totalLow + totalHigh) / 2 * (escortCount - 1) * (1 - CONVOY_PRICING.additionalEscortDiscount);
    items.push({ label: `${escortCount - 1} additional escort(s) (10% convoy discount)`, low: Math.round(additionalCost * 0.9), high: Math.round(additionalCost * 1.1) });
    totalLow += Math.round(additionalCost * 0.9);
    totalHigh += Math.round(additionalCost * 1.1);
    items.push({ label: 'Convoy Coordination Fee', low: CONVOY_PRICING.coordinationFee.low, high: CONVOY_PRICING.coordinationFee.high });
    totalLow += CONVOY_PRICING.coordinationFee.low;
    totalHigh += CONVOY_PRICING.coordinationFee.high;
  }

  // ── Warnings & Upsells ─────────────────────────────────────
  if (totalLow < 350) {
    warnings.push('⚠️ Job pricing below $350 minimum. Review for profitability.');
  }
  if (!hasAdvancedEquipment) {
    upsells.push('Consider quoting advanced equipment tier (+$0.10–$0.25/mi) for better visibility and safety.');
  }
  if (daysEstimate > 1) {
    upsells.push(`Multi-day layover should include $${MULTI_DAY.layover_per_day.low}–$${MULTI_DAY.layover_per_day.high}/day + hotel.`);
  }
  if (stateCode) {
    const pc = PERMIT_COST_ESTIMATES[stateCode] ?? PERMIT_COST_ESTIMATES.DEFAULT;
    upsells.push(`Permit cost passthrough for ${stateCode}: $${pc.singleTrip.low}–$${pc.singleTrip.high} (single trip), $${pc.superload.low}–$${pc.superload.high} (superload).`);
  }
  if (!isMountainPass && (region === 'west_coast' || region === 'southwest')) {
    upsells.push('Check if route crosses mountain passes — add $0.15–$0.40/mi elevation premium.');
  }
  if (currentDieselPrice === 0) {
    upsells.push('Include fuel surcharge — current diesel is above baseline ($3.50/gal).');
  }
  if (rushLevel === 'standard') {
    upsells.push('If dispatch is under 48hrs, apply same-day (1.75x) or next-day (1.35x) rush premium.');
  }

  const mid = Math.round((totalLow + totalHigh) / 2);

  return {
    low: Math.round(totalLow),
    mid,
    high: Math.round(totalHigh),
    lineItems: items,
    warnings,
    upsells,
  };
}

// ─── Broker Markup Calculator ──────────────────────────────────
/**
 * Calculates what a broker should charge their client vs what operators get paid.
 * Standard broker margin: 15-30%
 */
export interface BrokerMarkupOutput {
  operatorPay: { low: number; mid: number; high: number };
  brokerFee: { low: number; mid: number; high: number };
  clientPrice: { low: number; mid: number; high: number };
  marginPct: { low: number; high: number };
}

export function calculateBrokerMarkup(
  operatorEstimate: PricingOutput,
  marginPct: number = 20, // default 20% broker margin
): BrokerMarkupOutput {
  const marginLow = Math.max(marginPct - 5, 10); // floor at 10%
  const marginHigh = Math.min(marginPct + 5, 35); // cap at 35%

  const clientLow = Math.round(operatorEstimate.low / (1 - marginLow / 100));
  const clientMid = Math.round(operatorEstimate.mid / (1 - marginPct / 100));
  const clientHigh = Math.round(operatorEstimate.high / (1 - marginHigh / 100));

  return {
    operatorPay: { low: operatorEstimate.low, mid: operatorEstimate.mid, high: operatorEstimate.high },
    brokerFee: {
      low: clientLow - operatorEstimate.low,
      mid: clientMid - operatorEstimate.mid,
      high: clientHigh - operatorEstimate.high,
    },
    clientPrice: { low: clientLow, mid: clientMid, high: clientHigh },
    marginPct: { low: marginLow, high: marginHigh },
  };
}

// ─── Profitability Analyzer ────────────────────────────────────
/**
 * Per-job P&L breakdown showing true profitability after operating costs.
 */
export interface ProfitAnalysis {
  grossRevenue: number;
  costs: { label: string; amount: number }[];
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  isViable: boolean;
  recommendation: string;
}

export function analyzeProfitability(
  jobRevenue: number,
  distanceMiles: number,
  daysEstimate: number = 1,
  options: {
    fuelCostPerGallon?: number;
    mpg?: number;
    dailyInsuranceCost?: number;
    dailyWearCost?: number;
    dailyMealAllowance?: number;
    hotelCostPerNight?: number;
    tollCost?: number;
  } = {},
): ProfitAnalysis {
  const {
    fuelCostPerGallon = 3.85,
    mpg = 14,
    dailyInsuranceCost = 65,
    dailyWearCost = 45,
    dailyMealAllowance = 55,
    hotelCostPerNight = 110,
    tollCost = 0,
  } = options;

  const costs: { label: string; amount: number }[] = [];

  // Fuel (round-trip for deadhead)
  const fuelCost = Math.round((distanceMiles / mpg) * fuelCostPerGallon);
  costs.push({ label: `Fuel (${distanceMiles} mi @ ${mpg} mpg, $${fuelCostPerGallon}/gal)`, amount: fuelCost });

  // Insurance
  const insurance = Math.round(dailyInsuranceCost * daysEstimate);
  costs.push({ label: `Insurance (${daysEstimate} day(s) @ $${dailyInsuranceCost}/day)`, amount: insurance });

  // Vehicle wear (tires, oil, suspension)
  const wear = Math.round(dailyWearCost * daysEstimate);
  costs.push({ label: `Vehicle Wear (${daysEstimate} day(s) @ $${dailyWearCost}/day)`, amount: wear });

  // Meals
  const meals = Math.round(dailyMealAllowance * daysEstimate);
  costs.push({ label: `Meals/Per Diem (${daysEstimate} day(s) @ $${dailyMealAllowance}/day)`, amount: meals });

  // Hotel (if multi-day)
  if (daysEstimate > 1) {
    const hotelNights = daysEstimate - 1;
    const hotel = Math.round(hotelCostPerNight * hotelNights);
    costs.push({ label: `Hotel (${hotelNights} night(s) @ $${hotelCostPerNight}/night)`, amount: hotel });
  }

  // Tolls
  if (tollCost > 0) {
    costs.push({ label: 'Tolls & Bridge Fees', amount: tollCost });
  }

  // Communication / equipment depreciation
  const commCost = Math.round(15 * daysEstimate);
  costs.push({ label: 'Equipment Depreciation (radios, lights, signs)', amount: commCost });

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const netProfit = Math.round(jobRevenue - totalCosts);
  const profitMargin = jobRevenue > 0 ? Math.round((netProfit / jobRevenue) * 100) : 0;

  let recommendation = '';
  if (profitMargin >= 35) recommendation = '🟢 Excellent margin. Strong take.';
  else if (profitMargin >= 20) recommendation = '🟢 Healthy margin. Good job.';
  else if (profitMargin >= 10) recommendation = '🟡 Thin margin. Negotiate higher or add equipment addon.';
  else if (profitMargin >= 0) recommendation = '🔴 Break-even. Not worth the wear. Counter higher.';
  else recommendation = '🔴 LOSS. Decline or renegotiate immediately.';

  return {
    grossRevenue: Math.round(jobRevenue),
    costs,
    totalCosts,
    netProfit,
    profitMargin,
    isViable: profitMargin >= 15,
    recommendation,
  };
}

