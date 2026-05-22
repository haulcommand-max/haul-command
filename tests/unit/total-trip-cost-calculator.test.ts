import { describe, expect, it } from 'vitest';
import { calculateTotalTripCost } from '@/lib/tools/totalTripCost';

describe('calculateTotalTripCost', () => {
  it('calculates a complete oversize move budget with core cost components', () => {
    const result = calculateTotalTripCost({
      miles: 1200,
      jurisdictions: 4,
      travelDays: 3,
      escortCount: 2,
      permitAverage: 350,
      fuelMpg: 5.5,
      dieselPrice: 4.25,
      tolls: 250,
      overnightNights: 2,
      overnightRate: 140,
      waitHours: 4,
      policeHours: 0,
      routeSurvey: false,
      highPole: true,
      region: 'texas_gulf',
      complexity: 'overheight',
    });

    expect(result.permitCost).toBe(1400);
    expect(result.escortCost).toBeGreaterThan(0);
    expect(result.highPoleCost).toBeGreaterThan(0);
    expect(result.fuelCost).toBeGreaterThan(900);
    expect(result.midEstimate).toBeGreaterThan(result.lowEstimate);
    expect(result.highEstimate).toBeGreaterThan(result.midEstimate);
  });

  it('clamps unsafe inputs and surfaces planning warnings', () => {
    const result = calculateTotalTripCost({
      miles: -1,
      jurisdictions: 99,
      travelDays: 99,
      escortCount: 0,
      permitAverage: 99999,
      fuelMpg: 0,
      dieselPrice: 99,
      tolls: 99999,
      overnightNights: 99,
      overnightRate: 999,
      waitHours: 999,
      policeHours: 999,
      routeSurvey: false,
      highPole: true,
      region: 'northeast',
      complexity: 'superload',
    });

    expect(result.miles).toBe(1);
    expect(result.travelDays).toBe(30);
    expect(result.permitCost).toBe(25 * 5000 * 1.35);
    expect(result.tollCost).toBe(10000);
    expect(result.warnings).toContain('No escort cost included. Confirm the route does not require pilot cars.');
    expect(result.warnings).toContain('Many jurisdictions increase permit lead-time and denial risk.');
  });
});
