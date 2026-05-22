export type AxleWeightInput = {
  axleCount: number;
  outerBridgeFeet: number;
  grossWeightLbs: number;
  singleAxleMaxLbs: number;
  tandemAxleMaxLbs: number;
  stateCode: string;
};

export type AxleWeightResult = {
  bridgeLimitLbs: number;
  federalGrossCapLbs: number;
  controllingLimitLbs: number;
  overByLbs: number;
  underByLbs: number;
  status: 'legal' | 'over_bridge_limit';
  permitLikelyRequired: boolean;
  summary: string;
};

export type StateWeightLimit = {
  code: string;
  name: string;
  gvwLimitLbs: number;
  singleAxleLbs: number;
  tandemAxleLbs: number;
  note: string;
};

export const STATE_WEIGHT_LIMITS: StateWeightLimit[] = [
  { code: 'US', name: 'Federal baseline', gvwLimitLbs: 80000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Federal bridge formula baseline for interstate planning.' },
  { code: 'AZ', name: 'Arizona', gvwLimitLbs: 80000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Bridge formula enforcement is common on I-10 and I-40 corridors.' },
  { code: 'CA', name: 'California', gvwLimitLbs: 80000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Strict enforcement. Confirm permit conditions with Caltrans.' },
  { code: 'FL', name: 'Florida', gvwLimitLbs: 80000, singleAxleLbs: 22000, tandemAxleLbs: 44000, note: 'State-road allowances can differ from interstate rules.' },
  { code: 'LA', name: 'Louisiana', gvwLimitLbs: 88000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Some routes allow higher gross weights with proper authority.' },
  { code: 'MI', name: 'Michigan', gvwLimitLbs: 164000, singleAxleLbs: 18000, tandemAxleLbs: 32000, note: 'Michigan uses route-specific axle allowances and extra axles.' },
  { code: 'NY', name: 'New York', gvwLimitLbs: 80000, singleAxleLbs: 22400, tandemAxleLbs: 36000, note: 'NYSDOT may apply state-specific bridge rules and permit conditions.' },
  { code: 'OH', name: 'Ohio', gvwLimitLbs: 80000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Seasonal and local restrictions can change practical routing.' },
  { code: 'PA', name: 'Pennsylvania', gvwLimitLbs: 80000, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Certified-scale and route restrictions should be checked before dispatch.' },
  { code: 'TX', name: 'Texas', gvwLimitLbs: 80000, singleAxleLbs: 25000, tandemAxleLbs: 46000, note: 'State allowances and permits vary by highway class.' },
  { code: 'WA', name: 'Washington', gvwLimitLbs: 105500, singleAxleLbs: 20000, tandemAxleLbs: 34000, note: 'Higher gross weights may be available on selected routes.' },
];

export function getStateWeightLimit(code: string): StateWeightLimit {
  return STATE_WEIGHT_LIMITS.find((state) => state.code === code) ?? STATE_WEIGHT_LIMITS[0]!;
}

export function calculateFederalBridgeLimit(axleCount: number, outerBridgeFeet: number): number {
  if (axleCount <= 1) return 20000;
  const raw = 500 * ((outerBridgeFeet * axleCount) / (axleCount - 1) + 12 * axleCount + 36);
  return Math.floor(raw / 500) * 500;
}

export function evaluateAxleWeight(input: AxleWeightInput): AxleWeightResult {
  const bridgeLimitLbs = calculateFederalBridgeLimit(input.axleCount, input.outerBridgeFeet);
  const federalGrossCapLbs = input.axleCount >= 5 ? 80000 : bridgeLimitLbs;
  const state = getStateWeightLimit(input.stateCode);
  const controllingLimitLbs = Math.min(bridgeLimitLbs, Math.max(federalGrossCapLbs, state.gvwLimitLbs));
  const overByLbs = Math.max(0, input.grossWeightLbs - controllingLimitLbs);
  const underByLbs = Math.max(0, controllingLimitLbs - input.grossWeightLbs);
  const status = overByLbs > 0 ? 'over_bridge_limit' : 'legal';

  return {
    bridgeLimitLbs,
    federalGrossCapLbs,
    controllingLimitLbs,
    overByLbs,
    underByLbs,
    status,
    permitLikelyRequired: overByLbs > 0 || input.grossWeightLbs > state.gvwLimitLbs,
    summary:
      status === 'legal'
        ? `This axle group is ${underByLbs.toLocaleString()} lb under the controlling planning limit.`
        : `This axle group is ${overByLbs.toLocaleString()} lb over the controlling planning limit.`,
  };
}
