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
] as const;

// ─── Service Position Catalog (US + Canada) ──────────────────

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
];

// ─── International Position Extensions (57 Countries) ────────
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
