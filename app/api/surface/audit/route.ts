import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surface_id, audit_type } = body;

    if (!surface_id) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_surface_id", message: "surface_id required." } },
        { status: 400 }
      );
    }

    // 1. Fetch surface
    const { data: surface } = await supabaseAdmin
      .from("hc_page_surfaces")
      .select("*")
      .eq("id", surface_id)
      .single();

    if (!surface) {
      return NextResponse.json(
        { ok: false, error: { code: "surface_not_found", message: "Surface not found." } },
        { status: 404 }
      );
    }

    // 2. Run retrofit audit checks
    const failReasons: string[] = [];
    let keepMergeKill = "keep";

    // Direct answer block check
    if (!surface.ai_snippet_block_json || Object.keys(surface.ai_snippet_block_json).length === 0) {
      failReasons.push("Missing direct-answer block for AI snippet extraction.");
    }

    // FAQ block check
    if (!surface.faq_json || (Array.isArray(surface.faq_json) && surface.faq_json.length < 3)) {
      failReasons.push("FAQ block missing or under 3 items.");
    }

    // Link cluster check
    if (!surface.link_cluster_json || Object.keys(surface.link_cluster_json).length === 0) {
      failReasons.push("No internal link clusters — page is an orphan risk.");
    }

    // Title / H1 check
    if (!surface.title || surface.title.length < 20) {
      failReasons.push("Title tag is missing or too short for SEO.");
    }
    if (!surface.h1 || surface.h1 === surface.title) {
      failReasons.push("H1 is missing or identical to title tag.");
    }

    // Meta description check
    if (!surface.meta_description || surface.meta_description.length < 50) {
      failReasons.push("Meta description is missing or too thin.");
    }

    // Geo context check
    if (surface.country_code && !surface.freshness_block_json) {
      failReasons.push("Geo-scoped page lacks freshness context.");
    }

    // Score calculation
    const maxChecks = 7;
    const passedChecks = maxChecks - failReasons.length;
    const scoreRatio = passedChecks / maxChecks;

    const scoreJson = {
      total_checks: maxChecks,
      passed: passedChecks,
      failed: failReasons.length,
      score_percent: Math.round(scoreRatio * 100),
    };

    // Keep/merge/kill logic
    if (failReasons.length >= 5) keepMergeKill = "kill";
    else if (failReasons.length >= 3) keepMergeKill = "merge";

    // 3. Write audit row (append-only)
    const { data: audit, error } = await supabaseAdmin
      .from("audit.surface_audits")
      .insert({
        surface_id,
        audit_type: audit_type || "retrofit",
        score_json: scoreJson,
        fail_reasons_json: failReasons,
        keep_merge_kill: keepMergeKill,
      })
      .select("id")
      .single();

    // Fallback if audit schema isn't available
    if (error) {
      console.warn("Audit table write failed (schema may not be deployed yet):", error.message);
    }

    return NextResponse.json({
      ok: true,
      data: {
        surface_id,
        score: scoreJson,
        fail_reasons: failReasons,
        keep_merge_kill: keepMergeKill,
        audit_id: audit?.id || null,
      },
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "audit_failed", message: e.message || "Surface audit failed." } },
      { status: 500 }
    );
  }
}
