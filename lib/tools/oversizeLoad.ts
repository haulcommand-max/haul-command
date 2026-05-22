export type OversizeJurisdictionCode = 'US' | 'AZ' | 'CA' | 'FL' | 'LA' | 'MI' | 'NY' | 'OH' | 'PA' | 'TX' | 'WA';

export type OversizeInput = {
  jurisdiction: OversizeJurisdictionCode;
  widthFeet: number;
  heightFeet: number;
  lengthFeet: number;
  grossWeightLbs: number;
};

export type OversizeLimitProfile = {
  code: OversizeJurisdictionCode;
  label: string;
  maxWidthFeet: number;
  maxHeightFeet: number;
  maxLengthFeet: number;
  maxGrossWeightLbs: number;
  escortWidthOneFeet: number;
  escortWidthTwoFeet: number;
  highPoleHeightFeet: number;
  superloadWidthFeet: number;
  superloadWeightLbs: number;
  note: string;
};

export type OversizeAssessment = {
  jurisdiction: OversizeLimitProfile;
  status: 'legal' | 'permit_required' | 'escort_likely' | 'superload_review';
  statusLabel: string;
  permitRequired: boolean;
  escortCountEstimate: number;
  highPoleLikely: boolean;
  policeEscortLikely: boolean;
  superloadReviewLikely: boolean;
  exceeded: Array<{ field: string; actual: number; limit: number; unit: string }>;
  summary: string;
  nextActions: string[];
};

export const OVERSIZE_LIMITS: OversizeLimitProfile[] = [
  {
    code: 'US',
    label: 'Federal baseline (US)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'Baseline planning screen. State permits and route restrictions control the final move.',
  },
  {
    code: 'AZ',
    label: 'Arizona (AZ)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 14,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 14,
    escortWidthTwoFeet: 16,
    highPoleHeightFeet: 15,
    superloadWidthFeet: 16,
    superloadWeightLbs: 250000,
    note: 'Arizona commonly uses high-pole and route review thresholds for taller loads.',
  },
  {
    code: 'CA',
    label: 'California (CA)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 14,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 10,
    escortWidthTwoFeet: 12,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 15,
    superloadWeightLbs: 200000,
    note: 'California is stricter than the federal baseline on many escort and route conditions.',
  },
  {
    code: 'FL',
    label: 'Florida (FL)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 15,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'Florida escort triggers vary by roadway, metro area, and permit conditions.',
  },
  {
    code: 'LA',
    label: 'Louisiana (LA)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 88000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 15,
    superloadWidthFeet: 16,
    superloadWeightLbs: 232000,
    note: 'Bridge postings, parish rules, and flood/weather events can change Louisiana routing.',
  },
  {
    code: 'MI',
    label: 'Michigan (MI)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 164000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'Michigan axle configurations can allow higher GVW, but permit and bridge rules still control.',
  },
  {
    code: 'NY',
    label: 'New York (NY)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'New York City, parkways, bridges, and tunnels require separate route screening.',
  },
  {
    code: 'OH',
    label: 'Ohio (OH)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'Ohio turnpike and local route restrictions can change escort and timing requirements.',
  },
  {
    code: 'PA',
    label: 'Pennsylvania (PA)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 13.5,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 201000,
    note: 'Pennsylvania bridge, tunnel, and metro restrictions need route-level validation.',
  },
  {
    code: 'TX',
    label: 'Texas (TX)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 14,
    maxLengthFeet: 65,
    maxGrossWeightLbs: 80000,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 17,
    superloadWidthFeet: 16,
    superloadWeightLbs: 254300,
    note: 'Texas superheavy thresholds, DPS escorts, and curfews depend on corridor and permit class.',
  },
  {
    code: 'WA',
    label: 'Washington (WA)',
    maxWidthFeet: 8.5,
    maxHeightFeet: 14,
    maxLengthFeet: 75,
    maxGrossWeightLbs: 105500,
    escortWidthOneFeet: 12,
    escortWidthTwoFeet: 14,
    highPoleHeightFeet: 14.5,
    superloadWidthFeet: 16,
    superloadWeightLbs: 200000,
    note: 'Washington pilot/escort certification and route restrictions need permit-condition review.',
  },
];

export function getOversizeLimitProfile(code: OversizeJurisdictionCode): OversizeLimitProfile {
  return OVERSIZE_LIMITS.find((profile) => profile.code === code) ?? OVERSIZE_LIMITS[0];
}

export function assessOversizeLoad(input: OversizeInput): OversizeAssessment {
  const profile = getOversizeLimitProfile(input.jurisdiction);
  const exceeded = [
    { field: 'Width', actual: input.widthFeet, limit: profile.maxWidthFeet, unit: 'ft' },
    { field: 'Height', actual: input.heightFeet, limit: profile.maxHeightFeet, unit: 'ft' },
    { field: 'Length', actual: input.lengthFeet, limit: profile.maxLengthFeet, unit: 'ft' },
    { field: 'Gross weight', actual: input.grossWeightLbs, limit: profile.maxGrossWeightLbs, unit: 'lb' },
  ].filter((row) => row.actual > row.limit);

  const permitRequired = exceeded.length > 0;
  const superloadReviewLikely =
    input.widthFeet >= profile.superloadWidthFeet || input.grossWeightLbs >= profile.superloadWeightLbs;
  const escortCountEstimate = input.widthFeet >= profile.escortWidthTwoFeet ? 2 : input.widthFeet >= profile.escortWidthOneFeet ? 1 : 0;
  const highPoleLikely = input.heightFeet >= profile.highPoleHeightFeet;
  const policeEscortLikely = superloadReviewLikely || input.widthFeet >= 16;

  let status: OversizeAssessment['status'] = 'legal';
  if (superloadReviewLikely) status = 'superload_review';
  else if (escortCountEstimate > 0 || highPoleLikely || policeEscortLikely) status = 'escort_likely';
  else if (permitRequired) status = 'permit_required';

  const statusLabel = {
    legal: 'Likely legal-size planning screen',
    permit_required: 'Permit likely required',
    escort_likely: 'Escort review likely required',
    superload_review: 'Superload / engineering review likely',
  }[status];

  const nextActions = [
    permitRequired ? 'Confirm oversize or overweight permit class with the issuing authority.' : 'Keep permit proof available if a local rule is stricter than the baseline.',
    escortCountEstimate > 0 ? `Plan for at least ${escortCountEstimate} escort vehicle${escortCountEstimate > 1 ? 's' : ''} before quoting.` : 'Check corridor-specific escort triggers if the route crosses metro or restricted zones.',
    highPoleLikely ? 'Screen vertical clearance and high-pole requirements before dispatch.' : 'Run vertical clearance checks if height approaches bridge or utility thresholds.',
    superloadReviewLikely ? 'Budget time for engineering review, police escort coordination, and route survey.' : 'Re-check weight distribution with the axle-weight calculator.',
  ];

  const summary =
    status === 'legal'
      ? `This load is within the ${profile.label} baseline dimensions entered here.`
      : `${exceeded.map((row) => row.field.toLowerCase()).join(', ')} exceed ${profile.label} planning limits.`;

  return {
    jurisdiction: profile,
    status,
    statusLabel,
    permitRequired,
    escortCountEstimate,
    highPoleLikely,
    policeEscortLikely,
    superloadReviewLikely,
    exceeded,
    summary,
    nextActions,
  };
}
