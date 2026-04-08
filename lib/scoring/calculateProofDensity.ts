/**
 * Proof Density Score Calculator
 * 
 * Measures the density and quality of verified proof across an entity.
 * 
 * Weights from canonical spec:
 *   verified_identity: 0.15
 *   verified_insurance: 0.15
 *   verified_credentials: 0.15
 *   verified_equipment: 0.10
 *   verified_corridor_history: 0.15
 *   review_backed_proof: 0.10
 *   recent_photos_with_captions: 0.10
 *   response_time_evidence: 0.10
 */

export interface ProofDensityInput {
  hasVerifiedIdentity: boolean;
  hasVerifiedInsurance: boolean;
  hasVerifiedCredentials: boolean;
  hasVerifiedEquipment: boolean;
  hasVerifiedCorridorHistory: boolean;
  hasReviewBackedProof: boolean;
  hasRecentPhotos: boolean;
  hasResponseTimeEvidence: boolean;
}

export interface ProofDensityOutput {
  score: number;
  band: string;
  fail_reasons: string[];
  top_actions: string[];
}

export function calculateProofDensity(input: ProofDensityInput): ProofDensityOutput {
  let score = 0;
  const failReasons: string[] = [];
  const topActions: string[] = [];

  if (input.hasVerifiedIdentity) score += 15;
  else { failReasons.push("No verified identity."); topActions.push("Complete identity verification."); }

  if (input.hasVerifiedInsurance) score += 15;
  else { failReasons.push("No verified insurance."); topActions.push("Upload current insurance certificate."); }

  if (input.hasVerifiedCredentials) score += 15;
  else { failReasons.push("No verified credentials."); topActions.push("Upload TWIC, state certs, or industry credentials."); }

  if (input.hasVerifiedEquipment) score += 10;
  else { failReasons.push("No verified equipment."); topActions.push("Add equipment photos with captions."); }

  if (input.hasVerifiedCorridorHistory) score += 15;
  else { failReasons.push("No verified corridor history."); topActions.push("Document completed routes or corridor experience."); }

  if (input.hasReviewBackedProof) score += 10;
  else { failReasons.push("Reviews lack proof-like detail."); }

  if (input.hasRecentPhotos) score += 10;
  else { failReasons.push("No recent photos with captions."); topActions.push("Upload recent job or equipment photos."); }

  if (input.hasResponseTimeEvidence) score += 10;
  else { failReasons.push("No response time evidence."); }

  let band = "thin";
  if (score >= 90) band = "dominant";
  else if (score >= 75) band = "strong";
  else if (score >= 60) band = "improvable";
  else if (score >= 40) band = "weak";

  return { score, band, fail_reasons: failReasons, top_actions: topActions.slice(0, 3) };
}
