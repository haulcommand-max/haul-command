export interface MediaOpportunityScoreInput {
  searchDemand?: number;
  moneyValue?: number;
  countryTier?: number;
  localSupplyGap?: number;
  trainingValue?: number;
  adGridValue?: number;
  claimLikelihood?: number;
  faqFrequency?: number;
  liveKitQuestionFrequency?: number;
  youtubePotential?: number;
  linkabilityScore?: number;
  shareabilityScore?: number;
}

export interface MediaOpportunityScore {
  score: number;
  tier: "skip" | "watch" | "queue" | "priority";
  reasons: string[];
}

const WEIGHTS: Record<keyof MediaOpportunityScoreInput, number> = {
  searchDemand: 0.13,
  moneyValue: 0.16,
  countryTier: 0.08,
  localSupplyGap: 0.11,
  trainingValue: 0.08,
  adGridValue: 0.1,
  claimLikelihood: 0.12,
  faqFrequency: 0.08,
  liveKitQuestionFrequency: 0.05,
  youtubePotential: 0.04,
  linkabilityScore: 0.03,
  shareabilityScore: 0.02,
};

function clamp(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value ?? 0));
}

export function scoreMediaOpportunity(input: MediaOpportunityScoreInput): MediaOpportunityScore {
  const weighted = Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + clamp(input[key as keyof MediaOpportunityScoreInput]) * weight;
  }, 0);

  const score = Math.round(weighted);
  const reasons: string[] = [];

  if (clamp(input.moneyValue) >= 70) reasons.push("strong_money_path");
  if (clamp(input.claimLikelihood) >= 70) reasons.push("claim_conversion_likely");
  if (clamp(input.localSupplyGap) >= 70) reasons.push("market_gap_asset");
  if (clamp(input.linkabilityScore) >= 70) reasons.push("journalist_or_embed_potential");
  if (clamp(input.liveKitQuestionFrequency) >= 60 || clamp(input.faqFrequency) >= 70) {
    reasons.push("repeated_question_signal");
  }

  const tier: MediaOpportunityScore["tier"] =
    score >= 80 ? "priority" : score >= 60 ? "queue" : score >= 40 ? "watch" : "skip";

  return { score, tier, reasons };
}
