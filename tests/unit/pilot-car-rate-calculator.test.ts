import { describe, expect, it } from 'vitest';
import { calculatePilotCarRate } from '@/lib/tools/pilotCarRate';

describe('calculatePilotCarRate', () => {
  it('returns a defensible range and component breakdown for a standard two-escort move', () => {
    const result = calculatePilotCarRate({
      miles: 650,
      escortCount: 2,
      waitHours: 4,
      region: 'texas_gulf',
      difficulty: 'overwide',
      highPole: false,
      overnightNights: 1,
    });

    expect(result.travelDays).toBe(2);
    expect(result.billableMiles).toBe(650);
    expect(result.midEstimate).toBeGreaterThan(result.lowEstimate);
    expect(result.highEstimate).toBeGreaterThan(result.midEstimate);
    expect(result.escortLabor).toBeGreaterThan(0);
    expect(result.mileageCharge).toBeGreaterThan(0);
    expect(result.waitCharge).toBe(680);
  });

  it('adds high-pole charges and clamps unsafe input extremes', () => {
    const result = calculatePilotCarRate({
      miles: -100,
      escortCount: 99,
      waitHours: 200,
      region: 'northeast',
      difficulty: 'superload',
      highPole: true,
      overnightNights: 99,
    });

    expect(result.billableMiles).toBe(150);
    expect(result.travelDays).toBe(1);
    expect(result.highPoleCharge).toBe(625);
    expect(result.waitCharge).toBe(8 * 96 * 85);
    expect(result.overnightCharge).toBe(8 * 30 * 135);
  });
});
