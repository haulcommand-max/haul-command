import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { calculateProfileCompleteness } from "@/lib/scoring/calculateProfileCompleteness";
import { calculateAttributeCoverage } from "@/lib/scoring/calculateAttributeCoverage";
import { calculateProofDensity } from "@/lib/scoring/calculateProofDensity";
import { calculateFreshness } from "@/lib/scoring/calculateFreshness";
import { calculateReviewSpecificity } from "@/lib/scoring/calculateReviewSpecificity";
import { calculateEntityConsistency } from "@/lib/scoring/calculateEntityConsistency";
import { calculateAiReadiness } from "@/lib/scoring/calculateAiReadiness";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entity_id");

  if (!entityId) {
    return NextResponse.json(
      { ok: false, error: { code: "missing_entity_id", message: "entity_id query param required." } },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch entity + profile
    const { data: entity } = await supabaseAdmin
      .from("hc_entities")
      .select("*")
      .eq("id", entityId)
      .single();

    if (!entity) {
      return NextResponse.json(
        { ok: false, error: { code: "entity_not_found", message: "Entity not found." } },
        { status: 404 }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("hc_entity_profiles")
      .select("*")
      .eq("entity_id", entityId)
      .maybeSingle();

    // 2. Count supporting data
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

    // 3. Calculate all sub-scores
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

    const attrCoverage = calculateAttributeCoverage({
      declaredCount: attrCount || 0,
      inferredCount: 0,
      reviewExtractedCount: 0,
      proofBackedCount: proofCount || 0,
      countryRelevantCount: entity.country_code ? Math.min(attrCount || 0, 3) : 0,
      totalPossible: 15,
    });

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

    const freshness = calculateFreshness({
      lastProfileUpdateDaysAgo: profile ? daysSince(profile.updated_at) : null,
      lastReviewDaysAgo: null,
      lastProofRefreshDaysAgo: null,
      lastAvailabilityConfirmDaysAgo: null,
      lastCorridorActivityDaysAgo: null,
      lastPhotoOrQaDaysAgo: null,
    });

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

    const consistency = calculateEntityConsistency({
      profileVsServicesMatch: profile?.service_summary ? 0.7 : 0,
      servicesVsPagesMatch: (surfaceCount || 0) > 0 ? 0.6 : 0,
      pagesVsReviewsMatch: (reviewCount || 0) > 0 ? 0.5 : 0,
      reviewsVsAttributesMatch: 0.5,
      attributesVsQueriesMatch: 0.3,
      glossaryVsUsageMatch: 0.5,
      countryRenderMatch: entity.country_code ? 0.9 : 0.3,
      currencyRenderMatch: entity.currency_code ? 0.9 : 0.3,
    });

    // 4. Calculate overall AI readiness
    const overall = calculateAiReadiness({
      profile_completeness_score: completeness.score,
      attribute_coverage_score: attrCoverage.score,
      proof_density_score: proofDensity.score,
      freshness_score: freshness.score,
      review_specificity_score: reviewSpec.score,
      geo_fit_score: entity.country_code ? 70 : 20,
      language_fit_score: entity.canonical_language ? 60 : 20,
      internal_link_score: (surfaceCount || 0) > 0 ? 50 : 10,
      query_coverage_score: 30,
      conversion_readiness_score: profile?.contact_json ? 50 : 10,
    });

    // 5. Write score snapshot
    await supabaseAdmin.from("hc_ai_scores").insert({
      target_type: "entity",
      target_id: entityId,
      completeness_score: completeness.score,
      attribute_coverage_score: attrCoverage.score,
      proof_density_score: proofDensity.score,
      freshness_score: freshness.score,
      review_specificity_score: reviewSpec.score,
      geo_fit_score: entity.country_code ? 70 : 20,
      language_fit_score: entity.canonical_language ? 60 : 20,
      internal_link_score: (surfaceCount || 0) > 0 ? 50 : 10,
      query_coverage_score: 30,
      conversion_readiness_score: profile?.contact_json ? 50 : 10,
      entity_consistency_score: consistency.score,
      overall_ai_readiness_score: overall.overall_score,
      score_payload_json: {
        completeness,
        attrCoverage,
        proofDensity,
        freshness,
        reviewSpec,
        consistency,
        overall,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        overall_score: overall.overall_score,
        band: overall.band,
        top_actions: overall.top_actions,
        breakdown: {
          completeness,
          attribute_coverage: attrCoverage,
          proof_density: proofDensity,
          freshness,
          review_specificity: reviewSpec,
          entity_consistency: consistency,
        },
      },
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "score_failed", message: e.message || "Score calculation failed." } },
      { status: 500 }
    );
  }
}

function daysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
