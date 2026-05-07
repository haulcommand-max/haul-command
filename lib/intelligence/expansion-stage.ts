export type ExpansionStage =
  | "florida_completion"
  | "us_completion"
  | "next_country_selection"
  | "country_completion";

export interface ExpansionState {
  activeStage: ExpansionStage;
  activeCountryCode: string | null;
  activeAdmin1Code: string | null;
  activeMarketSlug: string | null;
}

export interface MarketCompletionScore {
  marketSlug: string;
  totalCompletionScore: number;
  blockers: string[];
}

export interface ExpansionThresholds {
  floridaCompletion: number;
  stateBaselineCompletion: number;
  unitedStatesCompletion: number;
  nextCountryActivation: number;
  countryCompletion: number;
}

export interface CountryExpansionCandidate {
  countryCode: string;
  expansionPriorityScore: number;
  legalRiskScore: number;
  selectedNext?: boolean;
}

export const DEFAULT_EXPANSION_THRESHOLDS: ExpansionThresholds = {
  floridaCompletion: 80,
  stateBaselineCompletion: 70,
  unitedStatesCompletion: 75,
  nextCountryActivation: 65,
  countryCompletion: 75,
};

export function getInitialExpansionState(): ExpansionState {
  return {
    activeStage: "florida_completion",
    activeCountryCode: "US",
    activeAdmin1Code: "FL",
    activeMarketSlug: "us-fl",
  };
}

export function getNextExpansionStage(
  current: ExpansionState,
  score: MarketCompletionScore,
  thresholds: ExpansionThresholds = DEFAULT_EXPANSION_THRESHOLDS,
  selectedCountry?: string,
): ExpansionState {
  if (score.blockers.length > 0) return current;

  if (
    current.activeStage === "florida_completion" &&
    score.totalCompletionScore >= thresholds.floridaCompletion
  ) {
    return {
      activeStage: "us_completion",
      activeCountryCode: "US",
      activeAdmin1Code: null,
      activeMarketSlug: "us",
    };
  }

  if (
    current.activeStage === "us_completion" &&
    score.totalCompletionScore >= thresholds.unitedStatesCompletion
  ) {
    return {
      activeStage: "next_country_selection",
      activeCountryCode: null,
      activeAdmin1Code: null,
      activeMarketSlug: null,
    };
  }

  if (current.activeStage === "next_country_selection" && selectedCountry) {
    return {
      activeStage: "country_completion",
      activeCountryCode: selectedCountry,
      activeAdmin1Code: null,
      activeMarketSlug: selectedCountry.toLowerCase(),
    };
  }

  if (
    current.activeStage === "country_completion" &&
    score.totalCompletionScore >= thresholds.countryCompletion
  ) {
    return {
      activeStage: "next_country_selection",
      activeCountryCode: null,
      activeAdmin1Code: null,
      activeMarketSlug: null,
    };
  }

  return current;
}

export function selectNextCountry(candidates: CountryExpansionCandidate[]): CountryExpansionCandidate | null {
  const eligible = candidates
    .filter(candidate => candidate.expansionPriorityScore >= DEFAULT_EXPANSION_THRESHOLDS.nextCountryActivation)
    .filter(candidate => candidate.legalRiskScore < 50);

  if (eligible.length === 0) return null;

  return [...eligible].sort((a, b) => {
    if (b.expansionPriorityScore !== a.expansionPriorityScore) {
      return b.expansionPriorityScore - a.expansionPriorityScore;
    }
    return a.legalRiskScore - b.legalRiskScore;
  })[0];
}
