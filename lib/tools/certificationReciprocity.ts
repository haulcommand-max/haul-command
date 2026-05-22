export type ReciprocityStatus = 'accepted' | 'conditional' | 'blocked';

export type CertificationType = 'pevo' | 'witpac' | 'defensive_driving' | 'state_escort';

export type ReciprocityInput = {
  issuedState: string;
  targetStates: string[];
  certificationType: CertificationType;
  hasDefensiveDriving: boolean;
  hasInsurance: boolean;
};

export type ReciprocityStateResult = {
  state: string;
  status: ReciprocityStatus;
  reason: string;
  nextAction: string;
};

export type ReciprocityResult = {
  overallStatus: ReciprocityStatus;
  accepted: ReciprocityStateResult[];
  conditional: ReciprocityStateResult[];
  blocked: ReciprocityStateResult[];
  results: ReciprocityStateResult[];
  riskScore: number;
  summary: string;
};

export type StateOption = {
  code: string;
  name: string;
};

export const US_STATE_OPTIONS: StateOption[] = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }));

const FORMAL_CERT_STATES = new Set([
  'AZ',
  'CO',
  'FL',
  'GA',
  'MN',
  'NV',
  'NM',
  'NY',
  'NC',
  'OK',
  'OR',
  'PA',
  'UT',
  'VA',
  'WA',
]);

const STRICT_NATIVE_ONLY = new Set(['NY']);

const RECIPROCITY_ACCEPTED_BY_TARGET: Record<string, string[]> = {
  AZ: ['CO', 'FL', 'MN', 'NC', 'OK', 'OR', 'UT', 'VA', 'WA'],
  CO: ['AZ', 'FL', 'MN', 'NC', 'OK', 'OR', 'UT', 'VA', 'WA'],
  FL: ['AZ', 'CO', 'MN', 'NC', 'OK', 'OR', 'UT', 'VA', 'WA'],
  GA: ['CO', 'FL', 'NC', 'OK', 'UT', 'VA', 'WA'],
  MN: ['AZ', 'CO', 'FL', 'NC', 'OK', 'OR', 'UT', 'VA', 'WA'],
  NV: ['CO', 'OR', 'UT', 'WA'],
  NM: ['AZ', 'CO', 'FL', 'NC', 'OK', 'OR', 'UT', 'VA', 'WA'],
  NC: ['AZ', 'CO', 'FL', 'MN', 'OK', 'OR', 'UT', 'VA', 'WA'],
  OK: ['AZ', 'CO', 'FL', 'MN', 'NC', 'OR', 'UT', 'VA', 'WA'],
  OR: ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'UT', 'VA', 'WA'],
  PA: ['CO', 'FL', 'GA', 'NC', 'UT', 'VA', 'WA'],
  UT: ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'OR', 'VA', 'WA'],
  VA: ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'OR', 'UT', 'WA'],
  WA: ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'OR', 'UT', 'VA'],
};

const CONDITIONAL_DEFENSIVE_DRIVING_STATES = new Set(['CA', 'TX']);

function normalizeState(state: string) {
  return state.trim().toUpperCase();
}

export function evaluateCertificationReciprocity(input: ReciprocityInput): ReciprocityResult {
  const issuedState = normalizeState(input.issuedState);
  const targetStates = Array.from(new Set(input.targetStates.map(normalizeState).filter(Boolean)));

  const results = targetStates.map((targetState) =>
    evaluateTargetState({
      ...input,
      issuedState,
      targetStates,
    }, targetState),
  );

  const accepted = results.filter((result) => result.status === 'accepted');
  const conditional = results.filter((result) => result.status === 'conditional');
  const blocked = results.filter((result) => result.status === 'blocked');

  const overallStatus: ReciprocityStatus =
    blocked.length > 0 ? 'blocked' : conditional.length > 0 ? 'conditional' : 'accepted';

  const riskScore = Math.min(100, blocked.length * 35 + conditional.length * 15 + (input.hasInsurance ? 0 : 20));

  return {
    overallStatus,
    accepted,
    conditional,
    blocked,
    results,
    riskScore,
    summary: buildSummary(overallStatus, accepted.length, conditional.length, blocked.length),
  };
}

function evaluateTargetState(input: ReciprocityInput, targetState: string): ReciprocityStateResult {
  const issuedState = normalizeState(input.issuedState);

  if (issuedState === targetState) {
    return {
      state: targetState,
      status: input.hasInsurance ? 'accepted' : 'conditional',
      reason: input.hasInsurance
        ? `${targetState} is the issuing state for this credential.`
        : `${targetState} matches the issuing state, but insurance proof still needs to be verified.`,
      nextAction: input.hasInsurance ? 'Keep credential, ID, and insurance proof in the permit packet.' : 'Upload current insurance proof before dispatch.',
    };
  }

  if (STRICT_NATIVE_ONLY.has(targetState)) {
    return {
      state: targetState,
      status: 'blocked',
      reason: `${targetState} is treated as a native-credential market in this checker.`,
      nextAction: `Get ${targetState}-specific credential proof before accepting work in this market.`,
    };
  }

  if (!FORMAL_CERT_STATES.has(targetState)) {
    if (CONDITIONAL_DEFENSIVE_DRIVING_STATES.has(targetState) && !input.hasDefensiveDriving) {
      return {
        state: targetState,
        status: 'conditional',
        reason: `${targetState} may not require the same PEVO reciprocity path, but defensive-driving or local permit proof can apply.`,
        nextAction: 'Confirm defensive-driving and permit-office requirements before dispatch.',
      };
    }

    return {
      state: targetState,
      status: input.hasInsurance ? 'accepted' : 'conditional',
      reason: `${targetState} is not flagged as a formal PEVO reciprocity market in the current checker.`,
      nextAction: input.hasInsurance
        ? 'Confirm permit-specific escort conditions when the oversize permit is issued.'
        : 'Verify insurance before relying on this result.',
    };
  }

  const acceptedIssuers = RECIPROCITY_ACCEPTED_BY_TARGET[targetState] ?? [];
  if (acceptedIssuers.includes(issuedState)) {
    return {
      state: targetState,
      status: input.hasInsurance ? 'accepted' : 'conditional',
      reason: `${targetState} is configured to accept ${issuedState} for PEVO-style reciprocity screening.`,
      nextAction: input.hasInsurance
        ? 'Carry credential card, government ID, insurance, and permit packet proof.'
        : 'Upload insurance proof before routing this operator.',
    };
  }

  if (input.certificationType === 'witpac') {
    return {
      state: targetState,
      status: 'conditional',
      reason: `WITPAC can support specialty wind moves, but ${targetState} still needs state credential acceptance confirmed.`,
      nextAction: `Confirm ${targetState} permit-office acceptance before dispatching a wind or blade move.`,
    };
  }

  return {
    state: targetState,
    status: 'blocked',
    reason: `${targetState} is a formal credential market and ${issuedState} is not listed as accepted in this checker.`,
    nextAction: `Use a ${targetState}-credentialed operator or verify a documented exception with the permit office.`,
  };
}

function buildSummary(status: ReciprocityStatus, accepted: number, conditional: number, blocked: number) {
  if (status === 'accepted') {
    return `All ${accepted} selected market${accepted === 1 ? '' : 's'} passed the current reciprocity screen.`;
  }

  if (status === 'conditional') {
    return `${accepted} accepted and ${conditional} conditional market${conditional === 1 ? '' : 's'} need proof review before dispatch.`;
  }

  return `${blocked} selected market${blocked === 1 ? '' : 's'} blocked the current credential set. Review before quoting or dispatching.`;
}
