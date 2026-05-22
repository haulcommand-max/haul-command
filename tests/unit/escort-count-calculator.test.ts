import { describe, expect, it } from 'vitest';
import { calculateEscortCount } from '@/lib/tools/escortCount';

describe('calculateEscortCount', () => {
  it('estimates a standard wide move with one lead escort', () => {
    const result = calculateEscortCount({
      jurisdiction: 'US',
      widthFeet: 12,
      heightFeet: 13.8,
      lengthFeet: 70,
      grossWeightLbs: 90000,
      roadContext: 'interstate',
      hazmat: false,
    });

    expect(result.leadEscorts).toBe(1);
    expect(result.chaseEscorts).toBe(0);
    expect(result.highPoleCars).toBe(0);
    expect(result.totalEscortVehicles).toBe(1);
    expect(result.planningStatus).toBe('escort_likely');
  });

  it('flags high-pole, route survey, and police review for a complex move', () => {
    const result = calculateEscortCount({
      jurisdiction: 'TX',
      widthFeet: 17,
      heightFeet: 17.2,
      lengthFeet: 150,
      grossWeightLbs: 260000,
      roadContext: 'restricted',
      hazmat: true,
    });

    expect(result.leadEscorts).toBe(1);
    expect(result.chaseEscorts).toBe(1);
    expect(result.highPoleCars).toBe(1);
    expect(result.totalEscortVehicles).toBe(2);
    expect(result.policeEscortsLikely).toBe(true);
    expect(result.routeSurveyLikely).toBe(true);
    expect(result.planningStatus).toBe('complex_move_review');
    expect(result.cautions).toContain('Hazmat moves may require separate escort, routing, or emergency-response coordination.');
  });

  it('clamps unusable numeric inputs before scoring', () => {
    const result = calculateEscortCount({
      jurisdiction: 'CA',
      widthFeet: -4,
      heightFeet: -1,
      lengthFeet: -10,
      grossWeightLbs: -200,
      roadContext: 'interstate',
      hazmat: false,
    });

    expect(result.totalEscortVehicles).toBe(0);
    expect(result.planningStatus).toBe('no_escort_flagged');
  });
});
