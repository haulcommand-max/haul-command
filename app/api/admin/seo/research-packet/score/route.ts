import { NextResponse } from "next/server";
import { scorePageResearchPacket, type PageResearchPacketInput } from "@/lib/seo/page-research-packet";
import { requireInternalRequest } from "@/lib/security/internal-request-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authFailure = requireInternalRequest(request);
  if (authFailure) return authFailure;

  try {
    const body = (await request.json()) as PageResearchPacketInput & { persist?: boolean };
    const score = scorePageResearchPacket(body);

    if (!body.persist) {
      return NextResponse.json({ ok: true, writesDatabase: false, score });
    }

    const { data, error } = await supabaseAdmin
      .from("hc_page_research_packets")
      .upsert(
        {
          target_url: body.target_url,
          page_family: body.page_family ?? null,
          role_id: body.role_id ?? null,
          country: body.country ?? null,
          region: body.region ?? null,
          city: body.city ?? null,
          corridor: body.corridor ?? null,
          search_intent: body.search_intent ?? null,
          buyer_intent: body.buyer_intent ?? null,
          provider_intent: body.provider_intent ?? null,
          advertiser_intent: body.advertiser_intent ?? null,
          top_serp_urls: body.top_serp_urls ?? [],
          bing_result_urls: body.bing_result_urls ?? [],
          paa_questions: body.paa_questions ?? [],
          competitor_urls: body.competitor_urls ?? [],
          authority_sources: body.authority_sources ?? [],
          forum_pain_points: body.forum_pain_points ?? [],
          review_pain_points: body.review_pain_points ?? [],
          competitor_gaps: body.competitor_gaps ?? [],
          internal_link_targets: body.internal_link_targets ?? [],
          unique_data_modules: body.unique_data_modules ?? [],
          recommended_schema: body.recommended_schema ?? [],
          recommended_media: body.recommended_media ?? [],
          unique_haul_command_angle: body.unique_haul_command_angle ?? null,
          provider_record_count: body.provider_record_count ?? 0,
          redundancy_score: body.redundancy_score ?? 0,
          source_confidence: body.source_confidence ?? "low",
          publish_score: score.score,
          indexability_decision: score.decision,
          score_payload_json: score,
        },
        { onConflict: "target_url" },
      )
      .select("id,target_url,publish_score,indexability_decision")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, score }, { status: 500 });
    }

    return NextResponse.json({ ok: true, writesDatabase: true, packet: data, score });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Invalid research packet payload" }, { status: 400 });
  }
}
