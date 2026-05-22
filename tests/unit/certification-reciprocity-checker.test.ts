import { describe, expect, it } from 'vitest';
import { evaluateCertificationReciprocity } from '@/lib/tools/certificationReciprocity';

describe('evaluateCertificationReciprocity', () => {
  it('accepts a reciprocal WA credential in UT and CO', () => {
    const result = evaluateCertificationReciprocity({
      issuedState: 'WA',
      targetStates: ['UT', 'CO'],
      certificationType: 'pevo',
      hasDefensiveDriving: true,
      hasInsurance: true,
    });

    expect(result.overallStatus).toBe('accepted');
    expect(result.accepted.map((item) => item.state)).toEqual(['UT', 'CO']);
    expect(result.blocked).toHaveLength(0);
  });

  it('blocks New York unless the credential is native', () => {
    const result = evaluateCertificationReciprocity({
      issuedState: 'WA',
      targetStates: ['NY'],
      certificationType: 'pevo',
      hasDefensiveDriving: true,
      hasInsurance: true,
    });

    expect(result.overallStatus).toBe('blocked');
    expect(result.blocked[0]?.state).toBe('NY');
  });

  it('marks defensive-driving markets conditional when proof is missing', () => {
    const result = evaluateCertificationReciprocity({
      issuedState: 'WA',
      targetStates: ['TX', 'CA'],
      certificationType: 'pevo',
      hasDefensiveDriving: false,
      hasInsurance: true,
    });

    expect(result.overallStatus).toBe('conditional');
    expect(result.conditional.map((item) => item.state)).toEqual(['TX', 'CA']);
  });
});
