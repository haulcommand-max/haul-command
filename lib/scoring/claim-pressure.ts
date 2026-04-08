export type ClaimPressureInput = {
  traffic_score: number;
  gap_score: number;
  competitive_risk_score: number;
  market_heat_score: number;
  trust_gap_score: number;
  seo_value_score: number;
  claim_probability_score: number;
};

export const calculateClaimPressureScore = (input: ClaimPressureInput): number => {
  const score =
    input.traffic_score * 0.2 +
    input.gap_score * 0.2 +
    input.competitive_risk_score * 0.15 +
    input.market_heat_score * 0.15 +
    input.trust_gap_score * 0.1 +
    input.seo_value_score * 0.1 +
    input.claim_probability_score * 0.1;

  return Number(score.toFixed(4));
};
