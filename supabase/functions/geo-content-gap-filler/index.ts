import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  // ── Gap Type 1: Operators without slug (need landing pages) ──
  const { data: sluglessOps, error: slugErr } = await supabase
    .from("hc_global_operators")
    .select("id, name, city, admin1_code, country_code, entity_type")
    .is("slug", null)
    .not("lat", "is", null)
    .limit(100);

  if (slugErr) {
    return new Response(JSON.stringify({ error: slugErr.message }), { status: 500, headers: corsHeaders });
  }

  // ── Gap Type 2: Cities with operators but no SEO page ──
  const { data: operatorCities } = await supabase
    .from("hc_global_operators")
    .select("city, admin1_code, country_code")
    .not("city", "is", null)
    .not("admin1_code", "is", null);

  // Deduplicate and find unique city-state combos
  const citySet = new Set<string>();
  const cityGaps: { city: string; state: string; country: string }[] = [];
  for (const op of operatorCities || []) {
    const key = `${op.city}|${op.admin1_code}|${op.country_code}`;
    if (!citySet.has(key)) {
      citySet.add(key);
      cityGaps.push({ city: op.city, state: op.admin1_code, country: op.country_code });
    }
  }

  // Check which cities already have SEO pages
  const { data: existingPages } = await supabase
    .from("seo_pages")
    .select("slug")
    .eq("page_type", "city");

  const existingSlugs = new Set((existingPages || []).map(p => p.slug));

  const tasks: any[] = [];

  // Slugless operator gaps
  for (const op of sluglessOps || []) {
    tasks.push({
      region: op.admin1_code || "UNKNOWN",
      gap_type: "MISSING_OPERATOR_SLUG",
      provider_id: op.id,
      details: {
        name: op.name,
        city: op.city,
        country: op.country_code,
        entity_type: op.entity_type,
      },
      status: "pending"
    });
  }

  // City landing page gaps (max 50 per run)
  let cityCount = 0;
  for (const city of cityGaps) {
    if (cityCount >= 50) break;
    const expectedSlug = `${city.state?.toLowerCase()}-${city.city?.toLowerCase()}`.replace(/\s+/g, '-');
    if (!existingSlugs.has(expectedSlug)) {
      tasks.push({
        region: city.state || "UNKNOWN",
        gap_type: "MISSING_CITY_SEO_PAGE",
        provider_id: null,
        details: {
          city: city.city,
          state: city.state,
          country: city.country,
          expected_slug: expectedSlug,
        },
        status: "pending"
      });
      cityCount++;
    }
  }

  if (tasks.length > 0) {
    const { error: insErr } = await supabase
      .from("hc_gap_radar")
      .insert(tasks);
      
    if (insErr) {
      console.error("hc_gap_radar insert failed, logging to mm_event_log", insErr);
      await supabase.from("mm_event_log").insert({
         event_type: "geo_content_gap_fill",
         payload: { tasks_count: tasks.length, sample: tasks.slice(0, 5) }
      });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    operator_slug_gaps: (sluglessOps || []).length,
    city_page_gaps: cityCount,
    total_emitted: tasks.length,
  }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
