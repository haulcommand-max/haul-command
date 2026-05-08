export type HCTruthLevel = 'excellent' | 'good' | 'watch' | 'risk' | 'blocked' | 'unknown';

export type HCTruthEntityType =
  | 'operator'
  | 'load'
  | 'payer'
  | 'corridor'
  | 'country'
  | 'route';

export type HCTruthSignal = {
  key: string;
  label: string;
  level: HCTruthLevel;
  scoreImpact: number;
  publicSummary: string;
  privateExplanation?: string;
  sourceTable?: string;
  evidenceCount?: number;
};

export type HCTruthCard = {
  entityType: HCTruthEntityType;
  entityId: string;
  score: number | null;
  level: HCTruthLevel;
  headline: string;
  summary: string;
  signals: HCTruthSignal[];
  missingRequirements: string[];
  suggestedActions: string[];
  suggestedQuestions: string[];
  monetizationTriggers: string[];
  adgridIntentTags: string[];
  lastComputedAt: string;
};

export type HCLoadRouteRiskLevel = 'excellent' | 'good' | 'watch' | 'risk' | 'blocked' | 'unknown';

export type HCLoadTruthInput = {
  loadId: string;
  rateCents: number | null;
  marketRateCents: number | null;
  deadheadMiles: number | null;
  estimatedDeadheadCostCents: number | null;
  payerReliabilityScore: number | null;
  depositFunded: boolean;
  escrowAvailable: boolean;
  credentialMatched: boolean;
  equipmentMatched: boolean;
  routeRiskLevel: HCLoadRouteRiskLevel;
  countryCode?: string;
  corridorSlug?: string;
  computedAt?: string;
};
