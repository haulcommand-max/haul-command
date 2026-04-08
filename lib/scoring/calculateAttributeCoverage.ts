/**
 * Attribute Coverage Score Calculator
 * 
 * Measures how well an entity's attributes are declared, inferred,
 * review-extracted, proof-backed, and country-relevant.
 * 
 * Weights from canonical spec:
 *   declared_attributes: 0.35
 *   inferred_attributes: 0.10
 *   review_extracted_attributes: 0.20
 *   proof_backed_attributes: 0.20
 *   country_relevant_attributes: 0.15
 */

export interface AttributeCoverageInput {
  declaredCount: number;
  inferredCount: number;
  reviewExtractedCount: number;
  proofBackedCount: number;
  countryRelevantCount: number;
  /** Total possible attributes for this entity type in this market */
  totalPossible: number;
}

export interface AttributeCoverageOutput {
  score: number;
  band: string;
  fail_reasons: string[];
  top_actions: string[];
}

export function calculateAttributeCoverage(input: AttributeCoverageInput): AttributeCoverageOutput {
  const denom = Math.max(input.totalPossible, 1);
  const failReasons: string[] = [];
  const topActions: string[] = [];

  // Each sub-score is a ratio of actual to possible, scaled by weight
  const declaredRatio = Math.min(1, input.declaredCount / denom);
  const inferredRatio = Math.min(1, input.inferredCount / denom);
  const reviewRatio = Math.min(1, input.reviewExtractedCount / denom);
  const proofRatio = Math.min(1, input.proofBackedCount / denom);
  const countryRatio = Math.min(1, input.countryRelevantCount / denom);

  const score = Math.round(
    (declaredRatio * 0.35 +
      inferredRatio * 0.10 +
      reviewRatio * 0.20 +
      proofRatio * 0.20 +
      countryRatio * 0.15) *
      100 *
      100
  ) / 100;

  if (declaredRatio < 0.3) {
    failReasons.push("Generic service-only profile — few explicit attributes declared.");
    topActions.push("Declare equipment, credentials, urgency capabilities, and sector experience.");
  }
  if (reviewRatio < 0.2) {
    failReasons.push("Reviews lack structured attribute mentions.");
    topActions.push("Request specific reviews mentioning services, speed, and equipment.");
  }
  if (proofRatio < 0.2) {
    failReasons.push("No proof-backed attributes — credentials and insurance unverified.");
    topActions.push("Upload insurance, credentials, or equipment photos.");
  }
  if (countryRatio < 0.15) {
    failReasons.push("Missing country-specific terminology and attribute coverage.");
    topActions.push("Add local service aliases and country-relevant credentials.");
  }

  let band = "thin";
  if (score >= 90) band = "dominant";
  else if (score >= 75) band = "strong";
  else if (score >= 60) band = "improvable";
  else if (score >= 40) band = "weak";

  return { score, band, fail_reasons: failReasons, top_actions: topActions };
}
