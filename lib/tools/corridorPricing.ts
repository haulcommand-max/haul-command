export type CorridorPricingRecord = {
  id: string;
  corridor_slug: string;
  month_start: string;
  avg_rate_per_mile: number | null;
  min_rate_per_mile: number | null;
  max_rate_per_mile: number | null;
  volume_index: number | null;
};

export type CorridorPricingInput = {
  routeMiles: number;
  escortVehicles: number;
  baseRatePerMile: number;
  floorRatePerMile: number;
  ceilingRatePerMile: number;
  volumeIndex: number;
  deadheadPercent: number;
  waitHours: number;
  waitHourlyRate: number;
};

export type CorridorPricingResult = {
  billableMiles: number;
  floor: number;
  midpoint: number;
  ceiling: number;
  waitCharge: number;
  demandMultiplier: number;
  confidence: 'stored_lane' | 'manual_estimate';
  warnings: string[];
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateCorridorPricing(input: CorridorPricingInput): CorridorPricingResult {
  const routeMiles = Math.max(1, input.routeMiles || 1);
  const escortVehicles = clamp(input.escortVehicles || 1, 1, 8);
  const floorRate = Math.max(0, input.floorRatePerMile || 0);
  const baseRate = Math.max(floorRate, input.baseRatePerMile || floorRate);
  const ceilingRate = Math.max(baseRate, input.ceilingRatePerMile || baseRate);
  const deadheadPercent = clamp(input.deadheadPercent || 0, 0, 100);
  const volumeIndex = clamp(input.volumeIndex || 50, 0, 100);
  const waitHours = Math.max(0, input.waitHours || 0);
  const waitHourlyRate = Math.max(0, input.waitHourlyRate || 0);

  const demandMultiplier = 1 + (volumeIndex - 50) / 250;
  const billableMiles = Math.round(routeMiles * (1 + deadheadPercent / 100));
  const waitCharge = waitHours * waitHourlyRate * escortVehicles;

  return {
    billableMiles,
    floor: Math.round(billableMiles * floorRate * escortVehicles + waitCharge),
    midpoint: Math.round(billableMiles * baseRate * demandMultiplier * escortVehicles + waitCharge),
    ceiling: Math.round(billableMiles * ceilingRate * demandMultiplier * escortVehicles + waitCharge),
    waitCharge: Math.round(waitCharge),
    demandMultiplier,
    confidence: 'manual_estimate',
    warnings: [
      'This is a planning range, not a binding quote. Confirm current availability, permits, insurance, route restrictions, and operator terms before booking.',
      volumeIndex === 50
        ? 'Volume index is neutral or unknown; use live quote collection for high-value moves.'
        : '',
    ].filter((warning): warning is string => Boolean(warning)),
  };
}

export function latestByCorridor(records: CorridorPricingRecord[]) {
  const grouped = new Map<string, CorridorPricingRecord[]>();
  for (const record of records) {
    const rows = grouped.get(record.corridor_slug) ?? [];
    rows.push(record);
    grouped.set(record.corridor_slug, rows);
  }
  return Array.from(grouped.entries()).map(([slug, rows]) => {
    const sorted = [...rows].sort((a, b) => b.month_start.localeCompare(a.month_start));
    return { slug, current: sorted[0], previous: sorted[1] ?? null };
  });
}
