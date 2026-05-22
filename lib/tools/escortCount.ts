import {
  getOversizeLimitProfile,
  OVERSIZE_LIMITS,
  type OversizeJurisdictionCode,
} from '@/lib/tools/oversizeLoad';

export type EscortRoadContext = 'interstate' | 'two_lane' | 'metro' | 'restricted' | 'cross_border';

export type EscortCountInput = {
  jurisdiction: OversizeJurisdictionCode;
  widthFeet: number;
  heightFeet: number;
  lengthFeet: number;
  grossWeightLbs: number;
  roadContext: EscortRoadContext;
  hazmat: boolean;
};

export type EscortCountResult = {
  jurisdictionLabel: string;
  leadEscorts: number;
  chaseEscorts: number;
  highPoleCars: number;
  policeEscortsLikely: boolean;
  routeSurveyLikely: boolean;
  totalEscortVehicles: number;
  planningStatus: 'no_escort_flagged' | 'escort_likely' | 'complex_move_review';
  statusLabel: string;
  triggers: string[];
  cautions: string[];
  nextActions: string[];
};

export const escortRoadContextLabels: Record<EscortRoadContext, string> = {
  interstate: 'Interstate / divided highway',
  two_lane: 'Two-lane or rural route',
  metro: 'Metro / urban restriction zone',
  restricted: 'Known restricted route',
  cross_border: 'Cross-border or multi-agency move',
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateEscortCount(input: EscortCountInput): EscortCountResult {
  const profile = getOversizeLimitProfile(input.jurisdiction);
  const widthFeet = clamp(input.widthFeet, 1, 30);
  const heightFeet = clamp(input.heightFeet, 1, 25);
  const lengthFeet = clamp(input.lengthFeet, 1, 250);
  const grossWeightLbs = clamp(input.grossWeightLbs, 1, 1_000_000);

  const triggers: string[] = [];
  const cautions: string[] = [];

  let leadEscorts = 0;
  let chaseEscorts = 0;
  let highPoleCars = 0;

  if (widthFeet >= profile.escortWidthTwoFeet) {
    leadEscorts = 1;
    chaseEscorts = 1;
    triggers.push(`Width is at or above the two-escort planning threshold for ${profile.label}.`);
  } else if (widthFeet >= profile.escortWidthOneFeet) {
    leadEscorts = 1;
    triggers.push(`Width is at or above the one-escort planning threshold for ${profile.label}.`);
  }

  if (heightFeet >= profile.highPoleHeightFeet) {
    highPoleCars = 1;
    leadEscorts = Math.max(leadEscorts, 1);
    triggers.push(`Height meets the high-pole planning threshold for ${profile.label}.`);
  } else if (heightFeet >= profile.highPoleHeightFeet - 0.5) {
    cautions.push('Height is close to the high-pole threshold. Confirm route clearance before quoting.');
  }

  if (lengthFeet >= 120) {
    leadEscorts = Math.max(leadEscorts, 1);
    chaseEscorts = Math.max(chaseEscorts, 1);
    triggers.push('Overall length is 120 ft or longer, which commonly triggers front and rear escort review.');
  } else if (lengthFeet >= 100) {
    chaseEscorts = Math.max(chaseEscorts, 1);
    triggers.push('Overall length is 100 ft or longer, which commonly triggers rear escort review.');
  }

  if (input.roadContext === 'two_lane' || input.roadContext === 'restricted') {
    if (widthFeet >= profile.escortWidthOneFeet || lengthFeet >= 90) {
      chaseEscorts = Math.max(chaseEscorts, 1);
      triggers.push(`${escortRoadContextLabels[input.roadContext]} increases rear-control risk.`);
    }
  }

  const superloadLike =
    widthFeet >= profile.superloadWidthFeet || grossWeightLbs >= profile.superloadWeightLbs || lengthFeet >= 150;
  const policeEscortsLikely =
    superloadLike ||
    (input.roadContext === 'metro' && (widthFeet >= profile.escortWidthTwoFeet || heightFeet >= profile.highPoleHeightFeet)) ||
    (input.roadContext === 'restricted' && widthFeet >= profile.superloadWidthFeet - 1);
  const routeSurveyLikely =
    superloadLike ||
    heightFeet >= profile.highPoleHeightFeet ||
    lengthFeet >= 120 ||
    input.roadContext === 'restricted' ||
    input.roadContext === 'cross_border';

  if (policeEscortsLikely) {
    triggers.push('Police or traffic-control coordination is likely based on size, weight, or route context.');
  }
  if (routeSurveyLikely) {
    triggers.push('Route survey or agency route review should be planned before dispatch.');
  }
  if (input.hazmat) {
    cautions.push('Hazmat moves may require separate escort, routing, or emergency-response coordination.');
  }
  if (input.roadContext === 'cross_border') {
    cautions.push('Cross-border moves need each jurisdiction checked separately; this is only a planning screen.');
  }

  const totalEscortVehicles = Math.max(leadEscorts + chaseEscorts, highPoleCars);
  const planningStatus =
    policeEscortsLikely || routeSurveyLikely
      ? 'complex_move_review'
      : totalEscortVehicles > 0
        ? 'escort_likely'
        : 'no_escort_flagged';
  const statusLabel = {
    no_escort_flagged: 'No escort flagged by this planning screen',
    escort_likely: 'Pilot car escort likely',
    complex_move_review: 'Complex escort review likely',
  }[planningStatus];

  const nextActions = [
    totalEscortVehicles > 0
      ? `Plan for at least ${totalEscortVehicles} escort vehicle${totalEscortVehicles === 1 ? '' : 's'} before pricing the move.`
      : 'Still verify permit conditions because local routes can require escorts below common width thresholds.',
    highPoleCars > 0
      ? 'Assign a qualified high-pole operator and check vertical clearance before dispatch.'
      : 'Run the oversize checker if height is close to bridge or utility clearance limits.',
    policeEscortsLikely
      ? 'Contact the permit office or law-enforcement coordinator before quoting final timing.'
      : 'Use the pilot-car rate calculator to price the estimated escort count.',
    routeSurveyLikely
      ? 'Budget time for route survey, agency review, and possible curfew restrictions.'
      : 'Check total trip cost after permit and escort count are known.',
  ];

  return {
    jurisdictionLabel: profile.label,
    leadEscorts,
    chaseEscorts,
    highPoleCars,
    policeEscortsLikely,
    routeSurveyLikely,
    totalEscortVehicles,
    planningStatus,
    statusLabel,
    triggers: triggers.length ? triggers : ['No escort trigger was detected from the entered planning dimensions.'],
    cautions,
    nextActions,
  };
}

export { OVERSIZE_LIMITS };
