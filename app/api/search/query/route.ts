import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query_text,
      query_country_code,
      query_region_code,
      query_city,
      query_lat,
      query_lng,
      query_urgency,
      query_language,
      user_id,
      anonymous_session_id,
    } = body;

    if (!query_text) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_query", message: "query_text required." } },
        { status: 400 }
      );
    }

    // 1. Insert intent query record
    const { data: intentQuery, error: insertError } = await supabaseAdmin
      .from("hc_intent_queries")
      .insert({
        user_id: user_id || null,
        anonymous_session_id: anonymous_session_id || null,
        query_text,
        query_language: query_language || "en",
        query_country_code: query_country_code || null,
        query_region_code: query_region_code || null,
        query_city: query_city || null,
        query_lat: query_lat || null,
        query_lng: query_lng || null,
        query_urgency: query_urgency || null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // 2. Attempt entity matching via full-text search
    let matchedEntities: any[] = [];
    const { data: entities } = await supabaseAdmin
      .from("hc_entities")
      .select("id, hc_id, canonical_name, entity_type, country_code, region_code, city_name, claim_status")
      .textSearch("canonical_name", query_text.split(" ").join(" & "), { type: "plain" })
      .eq("status", "active")
      .limit(10);

    if (entities && entities.length > 0) {
      matchedEntities = entities;
    }

    const matchSuccess = matchedEntities.length > 0;
    const gapDetected = !matchSuccess;

    // 3. Update the intent query with match results
    await supabaseAdmin
      .from("hc_intent_queries")
      .update({
        matched_entity_ids_json: matchedEntities.map((e) => e.id),
        match_success: matchSuccess,
        gap_detected: gapDetected,
      })
      .eq("id", intentQuery.id);

    // 4. If gap detected, enqueue gap analysis
    if (gapDetected) {
      await supabaseAdmin.from("hc_agent_jobs").insert({
        agent_name: "query_gap_agent",
        job_type: "gap_detection",
        target_type: "intent_query",
        target_id: intentQuery.id,
        input_payload_json: { query_text, query_country_code, query_region_code },
        priority: 180,
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        query_id: intentQuery.id,
        results: matchedEntities,
        match_success: matchSuccess,
        gap_detected: gapDetected,
      },
      meta: {
        paging: { limit: 10, offset: 0, total: matchedEntities.length },
        server_time: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "search_failed", message: e.message || "Search query failed." } },
      { status: 500 }
    );
  }
}
