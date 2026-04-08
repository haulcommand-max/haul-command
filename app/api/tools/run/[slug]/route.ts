import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const toolSlug = params.slug;
    const body = await request.json();

    // 1. Fetch tool definition
    const { data: tool } = await supabaseAdmin
      .from("hc_tools")
      .select("*")
      .eq("slug", toolSlug)
      .eq("status", "active")
      .single();

    if (!tool) {
      return NextResponse.json(
        { ok: false, error: { code: "tool_not_found", message: `Tool not found: ${toolSlug}` } },
        { status: 404 }
      );
    }

    // 2. Record the tool run
    const { data: toolRun, error: runError } = await supabaseAdmin
      .from("hc_tool_runs")
      .insert({
        tool_id: tool.id,
        user_id: body.user_id || null,
        anonymous_session_id: body.anonymous_session_id || null,
        input_payload_json: body.input || {},
      })
      .select("id")
      .single();

    if (runError) throw runError;

    // 3. Execute tool logic (placeholder — each tool gets a handler)
    const output = executeToolLogic(toolSlug, body.input || {});

    // 4. Write output and extracted intent
    await supabaseAdmin
      .from("hc_tool_runs")
      .update({
        output_payload_json: output.result,
        extracted_attributes_json: output.extractedAttributes,
        extracted_geo_json: output.extractedGeo,
        recommended_entities_json: output.recommendedEntities,
        gap_detection_json: output.gaps,
      })
      .eq("id", toolRun.id);

    // 5. Also emit as intent query for gap engine
    await supabaseAdmin.from("hc_intent_queries").insert({
      user_id: body.user_id || null,
      anonymous_session_id: body.anonymous_session_id || null,
      query_text: `tool:${toolSlug} ${JSON.stringify(body.input || {}).slice(0, 200)}`,
      query_language: "en",
      query_attributes_json: output.extractedAttributes,
      match_success: (output.recommendedEntities || []).length > 0,
      gap_detected: (output.gaps || []).length > 0,
    });

    return NextResponse.json({
      ok: true,
      data: {
        tool_run_id: toolRun.id,
        result: output.result,
        recommended_entities: output.recommendedEntities,
        gaps: output.gaps,
      },
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "tool_run_failed", message: e.message || "Tool execution failed." } },
      { status: 500 }
    );
  }
}

function executeToolLogic(slug: string, input: any) {
  // Each tool returns structured output with extracted intent signals
  switch (slug) {
    case "escort-requirement-calculator":
      return {
        result: {
          estimated_escorts_needed: input.load_width > 14 ? 2 : 1,
          permit_required: input.load_weight > 80000,
          route_survey_recommended: input.load_height > 16,
        },
        extractedAttributes: ["oversize_signage", "height_pole"],
        extractedGeo: input.origin_state ? { region: input.origin_state } : null,
        recommendedEntities: [],
        gaps: [],
      };

    case "staging-yard-finder":
      return {
        result: { message: "Search by city or corridor to find verified staging areas." },
        extractedAttributes: ["yard_available", "secure_parking"],
        extractedGeo: input.city ? { city: input.city } : null,
        recommendedEntities: [],
        gaps: input.city ? [{ gap_type: "missing_support_asset", context: input.city }] : [],
      };

    default:
      return {
        result: { message: "Tool executed." },
        extractedAttributes: [],
        extractedGeo: null,
        recommendedEntities: [],
        gaps: [],
      };
  }
}
