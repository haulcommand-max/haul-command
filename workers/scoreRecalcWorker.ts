import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateProfileCompleteness } from "@/lib/scoring/calculateProfileCompleteness";
import { calculateAttributeCoverage } from "@/lib/scoring/calculateAttributeCoverage";
import { calculateProofDensity } from "@/lib/scoring/calculateProofDensity";
import { calculateFreshness } from "@/lib/scoring/calculateFreshness";
import { calculateReviewSpecificity } from "@/lib/scoring/calculateReviewSpecificity";
import { calculateAiReadiness } from "@/lib/scoring/calculateAiReadiness";

/**
 * Score Recalculation Worker
 * 
 * Triggered after any mutation to an entity's profile, reviews, proof,
 * or attributes. Recalculates the full scoring stack and persists a new
 * snapshot to hc_ai_scores.
 */
export async function recalculateEntityScore(entityId: string) {
  // Fetch entity
  const { data: entity } = await supabaseAdmin
    .from("hc_entities")
    .select("*")
    .eq("id", entityId)
    .single();

  if (!entity) throw new Error(`Entity not found: ${entityId}`);

  const { data: profile } = await supabaseAdmin
    .from("hc_entity_profiles")
    .select("*")
    .eq("entity_id", entityId)
    .maybeSingle();

  const { count: attrCount } = await supabaseAdmin
    .from("hc_entity_attributes")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  const { count: proofCount } = await supabaseAdmin
    .from("hc_proof_items")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  const { count: reviewCount } = await supabaseAdmin
    .from("hc_reviews")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  const { count: surfaceCount } = await supabaseAdmin
    .from("hc_page_surfaces")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  // Profile completeness
  const completeness = calculateProfileCompleteness({
    hasBasicIdentity: !!entity.canonical_name && !!entity.entity_type,
    serviceCount: profile?.service_summary ? 2 : 0,
    attributeCount: attrCount || 0,
    hasGeoCoverage: !!entity.country_code,
    hasHours: !!profile?.hours_json && Object.keys(profile.hours_json).length > 0,
    hasContactFields: !!profile?.contact_json && Object.keys(profile.contact_json).length > 0,
    proofCount: proofCount || 0,
    faqCount: 0,
    photoCount: 0,
    languageCount: entity.canonical_language ? 1 : 0,
    hasSectorSpecificity: !!profile?.sectors_summary,
    hasRelatedLinks: (surfaceCount || 0) > 0,
  });

  // Attribute coverage
  const attrCoverage = calculateAttributeCoverage({
    declaredCount: attrCount || 0,
    inferredCount: 0,
    reviewExtractedCount: 0,
    proofBackedCount: proofCount || 0,
    countryRelevantCount: entity.country_code ? Math.min(attrCount || 0, 3) : 0,
    totalPossible: 15,
  });

  // Proof density
  const proofDensity = calculateProofDensity({
    hasVerifiedIdentity: entity.claim_status !== "unclaimed",
    hasVerifiedInsurance: (proofCount || 0) > 0,
    hasVerifiedCredentials: (proofCount || 0) > 1,
    hasVerifiedEquipment: false,
    hasVerifiedCorridorHistory: false,
    hasReviewBackedProof: (reviewCount || 0) > 0,
    hasRecentPhotos: false,
    hasResponseTimeEvidence: false,
  });

  // Freshness
  const freshness = calculateFreshness({
    lastProfileUpdateDaysAgo: profile ? daysSince(profile.updated_at) : null,
    lastReviewDaysAgo: null,
    lastProofRefreshDaysAgo: null,
    lastAvailabilityConfirmDaysAgo: null,
    lastCorridorActivityDaysAgo: null,
    lastPhotoOrQaDaysAgo: null,
  });

  // Review specificity
  const reviewSpec = calculateReviewSpecificity({
    totalReviews: reviewCount || 0,
    reviewsWithServiceMention: 0,
    reviewsWithUrgencyMention: 0,
    reviewsWithGeoMention: 0,
    reviewsWithNamedPerson: 0,
    reviewsWithResponseTime: 0,
    reviewsWithEquipmentMention: 0,
    reviewsWithOutcomeQuality: 0,
    reviewsWithSectorContext: 0,
  });

  // Overall AI readiness
  const geoFit = entity.country_code ? 70 : 20;
  const langFit = entity.canonical_language ? 60 : 20;
  const linkScore = (surfaceCount || 0) > 0 ? 50 : 10;
  const conversionScore = profile?.contact_json ? 50 : 10;

  const overall = calculateAiReadiness({
    profile_completeness_score: completeness.score,
    attribute_coverage_score: attrCoverage.score,
    proof_density_score: proofDensity.score,
    freshness_score: freshness.score,
    review_specificity_score: reviewSpec.score,
    geo_fit_score: geoFit,
    language_fit_score: langFit,
    internal_link_score: linkScore,
    query_coverage_score: 30,
    conversion_readiness_score: conversionScore,
  });

  // Persist
  await supabaseAdmin.from("hc_ai_scores").insert({
    target_type: "entity",
    target_id: entityId,
    completeness_score: completeness.score,
    attribute_coverage_score: attrCoverage.score,
    proof_density_score: proofDensity.score,
    freshness_score: freshness.score,
    review_specificity_score: reviewSpec.score,
    geo_fit_score: geoFit,
    language_fit_score: langFit,
    internal_link_score: linkScore,
    query_coverage_score: 30,
    conversion_readiness_score: conversionScore,
    overall_ai_readiness_score: overall.overall_score,
    score_payload_json: { completeness, attrCoverage, proofDensity, freshness, reviewSpec, overall },
  });

  // Update profile score fields
  if (profile) {
    await supabaseAdmin
      .from("hc_entity_profiles")
      .update({
        profile_completeness_score: completeness.score,
        ai_readiness_score: overall.overall_score,
        proof_density_score: proofDensity.score,
        freshness_score: freshness.score,
      })
      .eq("entity_id", entityId);
  }

  return {
    entity_id: entityId,
    overall_score: overall.overall_score,
    band: overall.band,
  };
}

function daysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
}
