import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Gap Detection Worker
 * 
 * Analyzes failed search queries to identify missing content,
 * missing profiles, missing service pages, and missing attributes.
 * Writes results to hc_query_gaps for the content queue and outreach queue.
 */
export async function detectQueryGaps(jobPayload: {
  intent_query_id: string;
  query_text: string;
  query_country_code?: string;
  query_region_code?: string;
}) {
  const { intent_query_id, query_text, query_country_code, query_region_code } = jobPayload;
  const lower = query_text.toLowerCase();

  const gaps: Array<{
    gap_type: string;
    recommended_build_action: string;
    recommended_monetization_action: string;
    recommended_outreach_action: string;
    severity_score: number;
  }> = [];

  // Service matching heuristic
  const serviceKeywords = [
    "pilot car", "escort vehicle", "oversize escort", "route survey",
    "twic escort", "permit", "staging yard", "installer", "steersman",
  ];

  const mentionedService = serviceKeywords.find((kw) => lower.includes(kw));

  // Check if entity type pages exist for this region
  if (mentionedService && query_region_code) {
    const { count } = await supabaseAdmin
      .from("hc_page_surfaces")
      .select("id", { count: "exact", head: true })
      .ilike("slug", `%${mentionedService.replace(/\s+/g, "-")}%`)
      .eq("region_code", query_region_code);

    if (!count || count === 0) {
      gaps.push({
        gap_type: "missing_service_page",
        recommended_build_action: `Create service page: ${mentionedService} in ${query_region_code}`,
        recommended_monetization_action: `Sell sponsor slot on ${mentionedService} page for ${query_region_code}`,
        recommended_outreach_action: `Recruit ${mentionedService} providers in ${query_region_code}`,
        severity_score: 80,
      });
    }
  }

  // Check if any entities exist in this region
  if (query_region_code) {
    const { count: entityCount } = await supabaseAdmin
      .from("hc_entities")
      .select("id", { count: "exact", head: true })
      .eq("region_code", query_region_code)
      .eq("status", "active");

    if (!entityCount || entityCount < 3) {
      gaps.push({
        gap_type: "missing_profile",
        recommended_build_action: `Seed at least 5 entity shells in ${query_region_code}`,
        recommended_monetization_action: `Launch empty-market sponsor package for ${query_region_code}`,
        recommended_outreach_action: `Outreach to operators in ${query_region_code}`,
        severity_score: 90,
      });
    }
  }

  // Write gaps
  if (gaps.length > 0) {
    const rows = gaps.map((g) => ({
      gap_type: g.gap_type,
      country_code: query_country_code || null,
      region_code: query_region_code || null,
      query_examples_json: [query_text],
      demand_count: 1,
      supply_count: 0,
      severity_score: g.severity_score,
      recommended_build_action: g.recommended_build_action,
      recommended_monetization_action: g.recommended_monetization_action,
      recommended_outreach_action: g.recommended_outreach_action,
      status: "open",
    }));

    await supabaseAdmin.from("hc_query_gaps").insert(rows);
  }

  return {
    intent_query_id,
    gaps_created: gaps.length,
    gap_types: gaps.map((g) => g.gap_type),
  };
}
