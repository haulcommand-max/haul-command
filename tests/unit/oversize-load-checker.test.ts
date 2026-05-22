import { describe, expect, it } from 'vitest';
import { assessOversizeLoad } from '@/lib/tools/oversizeLoad';

describe('assessOversizeLoad', () => {
  it('keeps a legal baseline load out of permit status', () => {
    const result = assessOversizeLoad({
      jurisdiction: 'US',
      widthFeet: 8.5,
      heightFeet: 13.5,
      lengthFeet: 53,
      grossWeightLbs: 78000,
    });

    expect(result.status).toBe('legal');
    expect(result.permitRequired).toBe(false);
    expect(result.escortCountEstimate).toBe(0);
    expect(result.exceeded).toHaveLength(0);
  });

  it('flags permit and one escort for a 12-foot Texas load', () => {
    const result = assessOversizeLoad({
      jurisdiction: 'TX',
      widthFeet: 12,
      heightFeet: 13.8,
      lengthFeet: 64,
      grossWeightLbs: 79000,
    });

    expect(result.permitRequired).toBe(true);
    expect(result.status).toBe('escort_likely');
    expect(result.escortCountEstimate).toBe(1);
    expect(result.exceeded.map((row) => row.field)).toContain('Width');
  });

  it('escalates wide and heavy loads into superload review', () => {
    const result = assessOversizeLoad({
      jurisdiction: 'CA',
      widthFeet: 16,
      heightFeet: 15,
      lengthFeet: 100,
      grossWeightLbs: 225000,
    });

    expect(result.status).toBe('superload_review');
    expect(result.superloadReviewLikely).toBe(true);
    expect(result.policeEscortLikely).toBe(true);
    expect(result.highPoleLikely).toBe(true);
    expect(result.escortCountEstimate).toBe(2);
  });
});
