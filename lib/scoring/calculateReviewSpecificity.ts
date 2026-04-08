/**
 * Review Specificity Score Calculator
 * 
 * Measures whether reviews contain actionable, attribute-rich detail
 * versus generic praise that adds no ranking or matching value.
 * 
 * Weights from canonical spec:
 *   exact_service_mentions: 0.20
 *   urgency_mentions: 0.10
 *   geo_mentions: 0.10
 *   named_technician_operator_mentions: 0.10
 *   time_to_response_mentions: 0.15
 *   equipment_mentions: 0.10
 *   outcome_quality_mentions: 0.15
 *   sector_or_job_context_mentions: 0.10
 */

export interface ReviewSpecificityInput {
  totalReviews: number;
  reviewsWithServiceMention: number;
  reviewsWithUrgencyMention: number;
  reviewsWithGeoMention: number;
  reviewsWithNamedPerson: number;
  reviewsWithResponseTime: number;
  reviewsWithEquipmentMention: number;
  reviewsWithOutcomeQuality: number;
  reviewsWithSectorContext: number;
}

export interface ReviewSpecificityOutput {
  score: number;
  band: string;
  fail_reasons: string[];
  generic_ratio: number;
}

export function calculateReviewSpecificity(input: ReviewSpecificityInput): ReviewSpecificityOutput {
  const total = Math.max(input.totalReviews, 1);
  const failReasons: string[] = [];

  const serviceRatio = input.reviewsWithServiceMention / total;
  const urgencyRatio = input.reviewsWithUrgencyMention / total;
  const geoRatio = input.reviewsWithGeoMention / total;
  const namedRatio = input.reviewsWithNamedPerson / total;
  const responseRatio = input.reviewsWithResponseTime / total;
  const equipRatio = input.reviewsWithEquipmentMention / total;
  const outcomeRatio = input.reviewsWithOutcomeQuality / total;
  const sectorRatio = input.reviewsWithSectorContext / total;

  const score = Math.round(
    (serviceRatio * 0.20 +
      urgencyRatio * 0.10 +
      geoRatio * 0.10 +
      namedRatio * 0.10 +
      responseRatio * 0.15 +
      equipRatio * 0.10 +
      outcomeRatio * 0.15 +
      sectorRatio * 0.10) *
      100 *
      100
  ) / 100;

  // Count reviews that have ZERO specificity signals
  const specificReviews = new Set<number>();
  // Approximate: if total specific mentions > total reviews * 0.5, reviews are generally specific
  const totalSpecificMentions =
    input.reviewsWithServiceMention +
    input.reviewsWithUrgencyMention +
    input.reviewsWithGeoMention +
    input.reviewsWithResponseTime +
    input.reviewsWithEquipmentMention +
    input.reviewsWithOutcomeQuality;

  const genericRatio = Math.max(0, 1 - totalSpecificMentions / (total * 3));

  if (serviceRatio < 0.3) failReasons.push("Reviews too generic — few mention exact services.");
  if (geoRatio < 0.2) failReasons.push("No geo/service specificity in reviews.");
  if (responseRatio < 0.2) failReasons.push("No urgency or response-time details in reviews.");
  if (outcomeRatio < 0.2) failReasons.push("Outcomes not described — reviews are vague praise.");
  if (input.totalReviews === 0) failReasons.push("No reviews at all.");

  let band = "thin";
  if (score >= 90) band = "dominant";
  else if (score >= 75) band = "strong";
  else if (score >= 60) band = "improvable";
  else if (score >= 40) band = "weak";

  return { score, band, fail_reasons: failReasons, generic_ratio: Math.round(genericRatio * 100) / 100 };
}
