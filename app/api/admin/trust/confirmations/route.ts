/**
 * Dual Confirmation API
 * POST /api/admin/trust/confirmations — Create or transition a dual confirmation record
 * GET  /api/admin/trust/confirmations?job_id=... — Get confirmation state
 */
import { NextRequest, NextResponse } from "next/server";
import { createDualConfirmation, type DualConfirmationRecord } from "@/lib/trust/dual-confirmation";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

function isAuthed(req: NextRequest): boolean {
    const auth = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    return !!ADMIN_SECRET && auth === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
    if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const jobId = req.nextUrl.searchParams.get("job_id");
    if (!jobId) return NextResponse.json({ error: "job_id required" }, { status: 400 });

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("hc_job_confirmations")
            .select("*")
            .eq("job_id", jobId)
            .maybeSingle();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json({ ok: true, confirmation: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { action, job_id, broker_id, escort_id, evidence_ids } = body;
        const supabase = getSupabaseAdmin();

        if (action === "create") {
            if (!job_id || !broker_id || !escort_id) {
                return NextResponse.json({ error: "job_id, broker_id, escort_id required" }, { status: 400 });
            }

            const record = createDualConfirmation(job_id, broker_id, escort_id);
            const { error } = await supabase.from("hc_job_confirmations").insert({
                job_id: record.jobId,
                broker_id: record.brokerId,
                escort_id: record.escortId,
                state: record.state,
                created_at: record.createdAt,
                last_transition: record.lastTransition,
                timeout_at: record.timeoutAt,
                evidence_ids: record.evidenceIds,
            });

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true, record });
        }

        if (action === "confirm") {
            const role = body.role; // "broker" or "escort"
            const now = new Date().toISOString();

            const { data: existing } = await supabase
                .from("hc_job_confirmations")
                .select("*")
                .eq("job_id", job_id)
                .maybeSingle();

            if (!existing) return NextResponse.json({ error: "Confirmation not found" }, { status: 404 });

            const updates: Record<string, any> = { last_transition: now };

            if (role === "broker") {
                updates.broker_confirmed_at = now;
                updates.state = existing.escort_confirmed_at ? "ledger_locked" : "broker_confirmed";
                if (updates.state === "ledger_locked") updates.locked_at = now;
            } else if (role === "escort") {
                updates.escort_confirmed_at = now;
                updates.state = existing.broker_confirmed_at ? "ledger_locked" : "escort_confirmed";
                if (updates.state === "ledger_locked") updates.locked_at = now;
            }

            if (evidence_ids) updates.evidence_ids = evidence_ids;

            const { error } = await supabase
                .from("hc_job_confirmations")
                .update(updates)
                .eq("job_id", job_id);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true, state: updates.state, job_id });
        }

        if (action === "dispute") {
            const { error } = await supabase
                .from("hc_job_confirmations")
                .update({ state: "disputed", last_transition: new Date().toISOString() })
                .eq("job_id", job_id);

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ ok: true, state: "disputed", job_id });
        }

        return NextResponse.json({ error: "action must be create|confirm|dispute" }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
