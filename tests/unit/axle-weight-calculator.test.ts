import { describe, expect, it } from 'vitest';
import { calculateFederalBridgeLimit, evaluateAxleWeight } from '@/lib/tools/axleWeight';

describe('axle weight calculator', () => {
  it('calculates the federal bridge formula for a standard five axle group', () => {
    expect(calculateFederalBridgeLimit(5, 51)).toBe(79500);
  });

  it('marks an overweight move as permit likely', () => {
    const result = evaluateAxleWeight({
      axleCount: 6,
      outerBridgeFeet: 55,
      grossWeightLbs: 96000,
      singleAxleMaxLbs: 20000,
      tandemAxleMaxLbs: 34000,
      stateCode: 'US',
    });

    expect(result.status).toBe('over_bridge_limit');
    expect(result.permitLikelyRequired).toBe(true);
    expect(result.overByLbs).toBeGreaterThan(0);
  });

  it('keeps a baseline legal move under the planning limit', () => {
    const result = evaluateAxleWeight({
      axleCount: 5,
      outerBridgeFeet: 51,
      grossWeightLbs: 78000,
      singleAxleMaxLbs: 20000,
      tandemAxleMaxLbs: 34000,
      stateCode: 'US',
    });

    expect(result.status).toBe('legal');
    expect(result.underByLbs).toBe(1500);
  });
});
