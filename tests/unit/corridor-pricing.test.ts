import { describe, expect, it } from 'vitest';
import { calculateCorridorPricing, latestByCorridor } from '@/lib/tools/corridorPricing';

describe('calculateCorridorPricing', () => {
  it('estimates a lane range from miles, escorts, demand, deadhead, and wait time', () => {
    const result = calculateCorridorPricing({
      routeMiles: 500,
      escortVehicles: 2,
      floorRatePerMile: 1.5,
      baseRatePerMile: 2,
      ceilingRatePerMile: 3,
      volumeIndex: 75,
      deadheadPercent: 10,
      waitHours: 4,
      waitHourlyRate: 80,
    });

    expect(result.billableMiles).toBe(550);
    expect(result.waitCharge).toBe(640);
    expect(result.demandMultiplier).toBeCloseTo(1.1);
    expect(result.floor).toBe(2290);
    expect(result.midpoint).toBe(3060);
    expect(result.ceiling).toBe(4270);
  });

  it('keeps the latest row per corridor first', () => {
    const rows = latestByCorridor([
      { id: '1', corridor_slug: 'i-10', month_start: '2026-04-01', avg_rate_per_mile: 2, min_rate_per_mile: 1, max_rate_per_mile: 3, volume_index: 40 },
      { id: '2', corridor_slug: 'i-10', month_start: '2026-05-01', avg_rate_per_mile: 3, min_rate_per_mile: 2, max_rate_per_mile: 4, volume_index: 60 },
    ]);

    expect(rows[0]?.current.id).toBe('2');
    expect(rows[0]?.previous?.id).toBe('1');
  });
});
