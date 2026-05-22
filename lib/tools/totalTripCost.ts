export type TripCostRegion =
  | 'southeast'
  | 'texas_gulf'
  | 'midwest'
  | 'mountain_west'
  | 'west_coast'
  | 'northeast'
  | 'canada';

export type TripComplexity = 'standard' | 'overwide' | 'overheight' | 'superload' | 'emergency';

export type TripCostBenchmarks = {
  pilotCarDaily: number;
  heightPoleDaily: number;
  policeHourly: number;
  waitHourly: number;
  routeSurveyFlat: number;
};

export type TotalTripCostInput = {
  miles: number;
  jurisdictions: number;
  travelDays: number;
  escortCount: number;
  permitAverage: number;
  fuelMpg: number;
  dieselPrice: number;
  tolls: number;
  overnightNights: number;
  overnightRate: number;
  waitHours: number;
  policeHours: number;
  routeSurvey: boolean;
  highPole: boolean;
  region: TripCostRegion;
  complexity: TripComplexity;
  benchmarks?: Partial<TripCostBenchmarks>;
};

export type TotalTripCostResult = {
  miles: number;
  travelDays: number;
  permitCost: number;
  escortCost: number;
  highPoleCost: number;
  fuelCost: number;
  tollCost: number;
  overnightCost: number;
  waitCost: number;
  policeCost: number;
  routeSurveyCost: number;
  contingency: number;
  lowEstimate: number;
  midEstimate: number;
  highEstimate: number;
  perMileMid: number;
  warnings: string[];
};

export const totalTripRegionLabels: Record<TripCostRegion, string> = {
  southeast: 'Southeast',
  texas_gulf: 'Texas / Gulf Coast',
  midwest: 'Midwest',
  mountain_west: 'Mountain West',
  west_coast: 'West Coast',
  northeast: 'Northeast',
  canada: 'Canada',
};

export const totalTripComplexityLabels: Record<TripComplexity, string> = {
  standard: 'Standard oversize',
  overwide: 'Overwide',
  overheight: 'Overheight',
  superload: 'Superload',
  emergency: 'Emergency / short notice',
};

const REGION_ESCORT_FACTOR: Record<TripCostRegion, number> = {
  southeast: 0.94,
  texas_gulf: 1.02,
  midwest: 1,
  mountain_west: 1.12,
  west_coast: 1.22,
  northeast: 1.28,
  canada: 1.3,
};

const COMPLEXITY_FACTOR: Record<TripComplexity, number> = {
  standard: 1,
  overwide: 1.1,
  overheight: 1.16,
  superload: 1.38,
  emergency: 1.55,
};

const DEFAULT_BENCHMARKS: TripCostBenchmarks = {
  pilotCarDaily: 450,
  heightPoleDaily: 625,
  policeHourly: 150,
  waitHourly: 85,
  routeSurveyFlat: 900,
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function dollars(value: number) {
  return Math.round(value);
}

export function calculateTotalTripCost(input: TotalTripCostInput): TotalTripCostResult {
  const miles = clampNumber(input.miles, 1, 5000);
  const jurisdictions = clampNumber(input.jurisdictions, 1, 25);
  const travelDays = clampNumber(input.travelDays, 1, 30);
  const escortCount = clampNumber(input.escortCount, 0, 8);
  const permitAverage = clampNumber(input.permitAverage, 0, 5000);
  const fuelMpg = clampNumber(input.fuelMpg, 2, 12);
  const dieselPrice = clampNumber(input.dieselPrice, 1, 12);
  const tolls = clampNumber(input.tolls, 0, 10000);
  const overnightNights = clampNumber(input.overnightNights, 0, 30);
  const overnightRate = clampNumber(input.overnightRate, 0, 500);
  const waitHours = clampNumber(input.waitHours, 0, 96);
  const policeHours = clampNumber(input.policeHours, 0, 96);
  const region = input.region in REGION_ESCORT_FACTOR ? input.region : 'midwest';
  const complexity = input.complexity in COMPLEXITY_FACTOR ? input.complexity : 'standard';
  const benchmarks = { ...DEFAULT_BENCHMARKS, ...(input.benchmarks ?? {}) };
  const factor = REGION_ESCORT_FACTOR[region] * COMPLEXITY_FACTOR[complexity];

  const permitCost = jurisdictions * permitAverage * (complexity === 'superload' ? 1.35 : 1);
  const escortCost = escortCount * travelDays * benchmarks.pilotCarDaily * factor;
  const highPoleCost = input.highPole ? travelDays * benchmarks.heightPoleDaily * factor : 0;
  const fuelCost = (miles / fuelMpg) * dieselPrice;
  const overnightCost = overnightNights * overnightRate * Math.max(1, escortCount);
  const waitCost = waitHours * benchmarks.waitHourly * Math.max(1, escortCount);
  const policeCost = policeHours * benchmarks.policeHourly;
  const routeSurveyCost = input.routeSurvey ? benchmarks.routeSurveyFlat * (complexity === 'superload' ? 1.25 : 1) : 0;

  const subtotal =
    permitCost +
    escortCost +
    highPoleCost +
    fuelCost +
    tolls +
    overnightCost +
    waitCost +
    policeCost +
    routeSurveyCost;
  const contingency = subtotal * (complexity === 'emergency' ? 0.18 : complexity === 'superload' ? 0.15 : 0.1);
  const midEstimate = subtotal + contingency;
  const warnings: string[] = [];

  if (escortCount === 0) warnings.push('No escort cost included. Confirm the route does not require pilot cars.');
  if (jurisdictions > 6) warnings.push('Many jurisdictions increase permit lead-time and denial risk.');
  if (input.highPole && !input.routeSurvey) warnings.push('High-pole work often pairs with a route survey on overheight moves.');
  if (complexity === 'superload') warnings.push('Superload pricing should be confirmed with authority-specific permit and routing requirements.');

  return {
    miles,
    travelDays,
    permitCost: dollars(permitCost),
    escortCost: dollars(escortCost),
    highPoleCost: dollars(highPoleCost),
    fuelCost: dollars(fuelCost),
    tollCost: dollars(tolls),
    overnightCost: dollars(overnightCost),
    waitCost: dollars(waitCost),
    policeCost: dollars(policeCost),
    routeSurveyCost: dollars(routeSurveyCost),
    contingency: dollars(contingency),
    lowEstimate: dollars(midEstimate * 0.86),
    midEstimate: dollars(midEstimate),
    highEstimate: dollars(midEstimate * 1.22),
    perMileMid: dollars(midEstimate / miles),
    warnings,
  };
}
