/**
 * Freshness Score Calculator
 * 
 * Measures how alive and recently active an entity appears.
 * Stale profiles die in AI search and map pack.
 * 
 * Weights from canonical spec:
 *   recent_profile_update: 0.20
 *   recent_review_activity: 0.20
 *   recent_proof_refresh: 0.15
 *   recent_availability_confirmation: 0.20
 *   recent_corridor_or_job_activity: 0.15
 *   recent_photo_or_q_and_a_update: 0.10
 */

export interface FreshnessInput {
  lastProfileUpdateDaysAgo: number | null;
  lastReviewDaysAgo: number | null;
  lastProofRefreshDaysAgo: number | null;
  lastAvailabilityConfirmDaysAgo: number | null;
  lastCorridorActivityDaysAgo: number | null;
  lastPhotoOrQaDaysAgo: number | null;
}

export interface FreshnessOutput {
  score: number;
  band: string;
  fail_reasons: string[];
}

function decayScore(daysAgo: number | null, maxDays: number): number {
  if (daysAgo === null) return 0;
  if (daysAgo <= 0) return 1;
  if (daysAgo >= maxDays) return 0;
  return 1 - daysAgo / maxDays;
}

export function calculateFreshness(input: FreshnessInput): FreshnessOutput {
  const failReasons: string[] = [];

  // 90-day decay window for most signals, 180 for proof
  const profileFresh = decayScore(input.lastProfileUpdateDaysAgo, 90);
  const reviewFresh = decayScore(input.lastReviewDaysAgo, 90);
  const proofFresh = decayScore(input.lastProofRefreshDaysAgo, 180);
  const availFresh = decayScore(input.lastAvailabilityConfirmDaysAgo, 30);
  const corridorFresh = decayScore(input.lastCorridorActivityDaysAgo, 90);
  const photoFresh = decayScore(input.lastPhotoOrQaDaysAgo, 120);

  const score = Math.round(
    (profileFresh * 0.20 +
      reviewFresh * 0.20 +
      proofFresh * 0.15 +
      availFresh * 0.20 +
      corridorFresh * 0.15 +
      photoFresh * 0.10) *
      100 *
      100
  ) / 100;

  if (profileFresh < 0.3) failReasons.push("Profile stale — not updated in months.");
  if (availFresh < 0.3) failReasons.push("Availability not recently confirmed.");
  if (reviewFresh < 0.3) failReasons.push("No recent review activity.");
  if (proofFresh < 0.3) failReasons.push("Proof documents may be outdated.");

  let band = "thin";
  if (score >= 90) band = "dominant";
  else if (score >= 75) band = "strong";
  else if (score >= 60) band = "improvable";
  else if (score >= 40) band = "weak";

  return { score, band, fail_reasons: failReasons };
}
