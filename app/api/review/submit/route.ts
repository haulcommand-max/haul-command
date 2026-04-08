import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity_id, reviewer_name, review_source, review_text_raw, review_rating, review_language } = body;

    if (!entity_id || !review_text_raw || !review_source) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "entity_id, review_source, and review_text_raw required." } },
        { status: 400 }
      );
    }

    // 1. Insert raw review
    const { data: review, error } = await supabaseAdmin
      .from("hc_reviews")
      .insert({
        entity_id,
        reviewer_name: reviewer_name || "Anonymous",
        review_source,
        review_text_raw,
        review_rating: review_rating || null,
        review_language: review_language || "en",
        review_date: new Date().toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (error) throw error;

    // 2. Enqueue attribute extraction agent job
    await supabaseAdmin.from("hc_agent_jobs").insert({
      agent_name: "attribute_extractor_agent",
      job_type: "extract_review_attributes",
      target_type: "review",
      target_id: review.id,
      input_payload_json: { entity_id, review_text: review_text_raw },
      priority: 200,
    });

    // 3. Enqueue score recalculation
    await supabaseAdmin.from("hc_agent_jobs").insert({
      agent_name: "score_recalc_agent",
      job_type: "score_recalculate",
      target_type: "entity",
      target_id: entity_id,
      priority: 150,
    });

    return NextResponse.json({
      ok: true,
      data: { review_id: review.id, message: "Review submitted. Attribute extraction queued." },
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "review_submit_failed", message: e.message || "Review submission failed." } },
      { status: 500 }
    );
  }
}
