import { describe, expect, it } from 'vitest';
import {
  calculateCertificationTimeline,
  type CertificationPath,
} from '@/lib/tools/certificationTimeline';

const paths: CertificationPath[] = [
  {
    id: 'wa',
    jurisdiction_code: 'WA',
    jurisdiction_name: 'Washington',
    requires_certification: true,
    training_hours: 24,
    certification_cost: 425,
    renewal_period_years: 3,
    reciprocity_states: ['UT'],
  },
  {
    id: 'ut',
    jurisdiction_code: 'UT',
    jurisdiction_name: 'Utah',
    requires_certification: true,
    training_hours: 16,
    certification_cost: 300,
    renewal_period_years: 4,
    reciprocity_states: ['WA'],
  },
  {
    id: 'az',
    jurisdiction_code: 'AZ',
    jurisdiction_name: 'Arizona',
    requires_certification: false,
    training_hours: null,
    certification_cost: null,
    renewal_period_years: null,
    reciprocity_states: null,
  },
  {
    id: 'ny',
    jurisdiction_code: 'NY',
    jurisdiction_name: 'New York',
    requires_certification: true,
    training_hours: null,
    certification_cost: 0,
    renewal_period_years: null,
    reciprocity_states: [],
  },
];

describe('calculateCertificationTimeline', () => {
  it('builds a planning timeline from training hours, paperwork, exam, and review time', () => {
    const result = calculateCertificationTimeline(paths, {
      targetCode: 'WA',
      currentCredentialCode: 'none',
      pace: 'part_time',
      startDate: '2026-05-22',
    });

    expect(result.target.jurisdiction_code).toBe('WA');
    expect(result.reciprocityLikely).toBe(false);
    expect(result.estimatedDays).toBe(37);
    expect(result.readyDate).toBe('2026-06-28');
    expect(result.steps.map((step) => step.label)).toEqual([
      'Book approved training',
      'Collect proof packet',
      'Exam or agency review',
    ]);
  });

  it('shortens the path when the selected credential is reciprocal', () => {
    const result = calculateCertificationTimeline(paths, {
      targetCode: 'UT',
      currentCredentialCode: 'WA',
      pace: 'weekend',
      startDate: '2026-05-22',
    });

    expect(result.reciprocityLikely).toBe(true);
    expect(result.currentCredential?.jurisdiction_code).toBe('WA');
    expect(result.estimatedDays).toBe(14);
    expect(result.steps[0]?.label).toBe('Confirm reciprocity path');
  });

  it('keeps no-certification jurisdictions honest instead of inventing training', () => {
    const result = calculateCertificationTimeline(paths, {
      targetCode: 'AZ',
      currentCredentialCode: 'none',
      pace: 'accelerated',
      startDate: '2026-05-22',
    });

    expect(result.trainingHours).toBeNull();
    expect(result.estimatedCost).toBe(0);
    expect(result.estimatedDays).toBe(1);
    expect(result.warnings[0]).toContain('No-certification states');
  });

  it('treats missing required training hours as unknown instead of near-zero effort', () => {
    const result = calculateCertificationTimeline(paths, {
      targetCode: 'NY',
      currentCredentialCode: 'none',
      pace: 'accelerated',
      startDate: '2026-05-22',
    });

    expect(result.trainingHours).toBeNull();
    expect(result.estimatedDays).toBeGreaterThan(1);
    expect(result.warnings).toContain(
      'Training hours are missing for this jurisdiction; do not quote a firm ready date until the official course schedule is verified.',
    );
  });

  it('short-circuits when the selected credential already matches the target', () => {
    const result = calculateCertificationTimeline(paths, {
      targetCode: 'WA',
      currentCredentialCode: 'WA',
      pace: 'part_time',
      startDate: '2026-05-22',
    });

    expect(result.nativeCredentialActive).toBe(true);
    expect(result.estimatedDays).toBe(0);
    expect(result.readyDate).toBe('2026-05-22');
    expect(result.steps[0]?.label).toBe('Confirm active target credential');
  });

  it('rejects inherited keys in the study pace guard', async () => {
    const { isCertificationStudyPace } = await import('@/lib/tools/certificationTimeline');

    expect(isCertificationStudyPace('part_time')).toBe(true);
    expect(isCertificationStudyPace('toString')).toBe(false);
  });
});
