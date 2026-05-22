export type CertificationPath = {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  requires_certification: boolean;
  training_hours: number | null;
  certification_cost: number | null;
  renewal_period_years: number | null;
  reciprocity_states: string[] | null;
};

export type CertificationStudyPace = 'weekend' | 'part_time' | 'accelerated';

export type CertificationTimelineInput = {
  targetCode: string;
  currentCredentialCode: string;
  pace: CertificationStudyPace;
  startDate: string;
};

export type CertificationTimelineResult = {
  target: CertificationPath;
  currentCredential: CertificationPath | null;
  reciprocityLikely: boolean;
  nativeCredentialActive: boolean;
  estimatedDays: number;
  readyDate: string;
  trainingHours: number | null;
  estimatedCost: number;
  renewalPeriodYears: number | null;
  steps: Array<{ label: string; days: number; detail: string }>;
  warnings: string[];
};

export const certificationPaceLabels: Record<CertificationStudyPace, string> = {
  weekend: 'Weekend pace',
  part_time: 'Part-time weekday pace',
  accelerated: 'Accelerated class pace',
};

const paceHoursPerWeek: Record<CertificationStudyPace, number> = {
  weekend: 6,
  part_time: 10,
  accelerated: 24,
};

export function isCertificationStudyPace(value: string): value is CertificationStudyPace {
  return Object.prototype.hasOwnProperty.call(paceHoursPerWeek, value);
}

function parseStartDate(value: string) {
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function calculateCertificationTimeline(
  paths: CertificationPath[],
  input: CertificationTimelineInput,
): CertificationTimelineResult {
  const target = paths.find((path) => path.jurisdiction_code === input.targetCode) ?? paths[0];
  if (!target) {
    throw new Error('At least one certification path is required.');
  }

  const currentCredential =
    input.currentCredentialCode === 'none'
      ? null
      : paths.find((path) => path.jurisdiction_code === input.currentCredentialCode) ?? null;
  const reciprocityLikely =
    Boolean(currentCredential) &&
    (target.jurisdiction_code === currentCredential?.jurisdiction_code ||
      Boolean(target.reciprocity_states?.includes(currentCredential?.jurisdiction_code ?? '')));
  const nativeCredentialActive = target.jurisdiction_code === currentCredential?.jurisdiction_code;

  const trainingHours = target.training_hours === null ? null : Math.max(0, target.training_hours ?? 0);
  const trainingHoursKnown = trainingHours !== null;
  const estimatedCost = Math.max(0, target.certification_cost ?? 0);
  const studyDays = target.requires_certification
    ? trainingHoursKnown
      ? Math.max(1, Math.ceil((trainingHours / paceHoursPerWeek[input.pace]) * 7))
      : 14
    : 0;
  const paperworkDays = target.requires_certification ? 5 : 1;
  const mvrDays = target.requires_certification ? 3 : 0;
  const examDays = target.requires_certification && !reciprocityLikely ? 2 : 0;
  const agencyReviewDays = target.requires_certification ? (reciprocityLikely ? 4 : 10) : 0;

  const steps = nativeCredentialActive
    ? [
        {
          label: 'Confirm active target credential',
          days: 0,
          detail: `You selected an active ${target.jurisdiction_name} credential for the target jurisdiction. Confirm expiration, insurance, equipment, and route-specific proof before dispatch.`,
        },
      ]
    : target.requires_certification
    ? [
        {
          label: reciprocityLikely ? 'Confirm reciprocity path' : 'Book approved training',
          days: reciprocityLikely ? 2 : studyDays,
          detail: reciprocityLikely
            ? `${target.jurisdiction_name} appears to honor ${currentCredential?.jurisdiction_name}; confirm proof requirements before dispatch.`
            : trainingHoursKnown
              ? `Plan ${trainingHours} training hour${trainingHours === 1 ? '' : 's'} at ${certificationPaceLabels[input.pace].toLowerCase()}.`
              : 'Training hours are not stored for this jurisdiction yet. Use this as a conservative planning hold until the official schedule is verified.',
        },
        {
          label: 'Collect proof packet',
          days: paperworkDays + mvrDays,
          detail: 'Gather ID, MVR, insurance proof, training completion, photo/signature, and any state-specific forms.',
        },
        {
          label: 'Exam or agency review',
          days: examDays + agencyReviewDays,
          detail: reciprocityLikely
            ? 'Agency review may be shorter when reciprocity is accepted, but the final permit office controls.'
            : 'Budget time for testing, background review, card issuance, or appointment availability.',
        },
      ]
    : [
        {
          label: 'Confirm local operating rules',
          days: 1,
          detail: `${target.jurisdiction_name} is not marked as requiring pilot-car certification in the current data, but equipment, insurance, and permit conditions can still apply.`,
        },
      ];

  const estimatedDays = steps.reduce((sum, step) => sum + step.days, 0);
  const readyDate = isoDate(addDays(parseStartDate(input.startDate), estimatedDays));
  const warnings = [
    target.requires_certification
      ? 'Final eligibility depends on the official issuing authority, not this estimator.'
      : 'No-certification states can still require permits, insurance, lighting, signs, or route-specific escort proof.',
    target.requires_certification && !trainingHoursKnown
      ? 'Training hours are missing for this jurisdiction; do not quote a firm ready date until the official course schedule is verified.'
      : '',
    estimatedCost === 0 ? 'No cost value is stored for this jurisdiction yet; verify fee schedules before quoting.' : '',
    !target.renewal_period_years ? 'Renewal period is not stored for this jurisdiction yet.' : '',
  ].filter((warning): warning is string => Boolean(warning));

  return {
    target,
    currentCredential,
    reciprocityLikely,
    nativeCredentialActive,
    estimatedDays,
    readyDate,
    trainingHours,
    estimatedCost,
    renewalPeriodYears: target.renewal_period_years,
    steps,
    warnings,
  };
}
