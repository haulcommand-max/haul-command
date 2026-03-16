// app/api/v1/trust/disputes/route.ts
//
// GET  /api/v1/trust/disputes?user_id=...   — disputes involving user
// POST /api/v1/trust/disputes               — file a dispute
// PATCH /api/v1/trust/disputes              — submit rebuttal or evidence

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role") ?? "both"; // complainant|respondent|both

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    let query = supabase.from("disputes").select("*");

    if (role === "complainant") {
        query = query.eq("complainant_id", userId);
    } else if (role === "respondent") {
        query = query.eq("respondent_id", userId);
    } else {
        query = query.or(`complainant_id.eq.${userId},respondent_id.eq.${userId}`);
    }

    if (status) query = query.eq("status", status);
    query = query.order("created_at", { ascending: false }).limit(50);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const disputes = (data ?? []) as any[];

    // Get evidence for each dispute
    const enriched = [];
    for (const d of disputes) {
        const { data: evidence } = await supabase
            .from("dispute_evidence")
            .select("id,evidence_type,file_name,description,submitted_by,verified,created_at")
            .eq("dispute_id", d.id)
            .order("created_at", { ascending: true });

        enriched.push({ ...d, evidence: evidence ?? [] });
    }

    return NextResponse.json({
        ok: true,
        user_id: userId,
        count: enriched.length,
        disputes: enriched,
    });
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.complainant_id || !body.respondent_id || !body.dispute_type || !body.summary) {
        return NextResponse.json(
            { error: "complainant_id, respondent_id, dispute_type, and summary required" },
            { status: 400 }
        );
    }

    const validTypes = ["non_payment", "no_show", "safety_violation", "service_quality", "fraud", "other"];
    if (!validTypes.includes(body.dispute_type)) {
        return NextResponse.json({ error: `dispute_type must be one of: ${validTypes.join(", ")}` }, { status: 400 });
    }

    const { data: dispute, error } = await supabase
        .from("disputes")
        .insert({
            complainant_id: body.complainant_id,
            respondent_id: body.respondent_id,
            job_id: body.job_id ?? null,
            dispute_type: body.dispute_type,
            severity: body.severity ?? "medium",
            status: "open",
            complainant_summary: body.summary,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        ok: true,
        dispute,
        next_steps: [
            "Upload supporting evidence (ratecons, screenshots, payment proofs)",
            "The respondent will be notified and given opportunity to submit a rebuttal",
            "Our team will review within 48 hours",
        ],
    });
}

export async function PATCH(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.dispute_id) {
        return NextResponse.json({ error: "dispute_id required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    // Rebuttal
    if (body.rebuttal) {
        updates.respondent_rebuttal = body.rebuttal;
        updates.status = "evidence_phase";
    }

    // Status update (admin)
    if (body.status) {
        updates.status = body.status;
        if (body.status === "resolved") {
            updates.resolved_at = new Date().toISOString();
            updates.resolution = body.resolution ?? "mutual";
        }
    }

    if (body.admin_notes) {
        updates.admin_notes = body.admin_notes;
    }

    const { data, error } = await supabase
        .from("disputes")
        .update(updates)
        .eq("id", body.dispute_id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Apply trust impact if resolved
    if (body.status === "resolved" && body.trust_impact) {
        await supabase.from("dispute_trust_impacts").insert({
            dispute_id: body.dispute_id,
            user_id: body.trust_impact.user_id,
            impact_type: body.trust_impact.type,
            trust_score_delta: body.trust_impact.delta,
            reason: body.trust_impact.reason ?? "Dispute resolved",
        });

        await supabase.from("disputes").update({ trust_impact_applied: true }).eq("id", body.dispute_id);
    }

    return NextResponse.json({ ok: true, dispute: data });
}
