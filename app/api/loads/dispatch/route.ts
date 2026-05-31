import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordLoadMatchQueue } from "@/lib/loads/load-match-queue";

type JsonRecord = Record<string, unknown>;

const asJsonRecord = (value: unknown): JsonRecord =>
    value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};

const arrayField = (record: JsonRecord, key: string): JsonRecord[] => {
    const value = record[key];
    return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [];
};

const stringField = (record: JsonRecord, key: string) => {
    const value = record[key];
    return typeof value === "string" ? value : undefined;
};

/**
 * POST /api/loads/dispatch
 * Compatibility route for dispatching an already-created canonical job.
 *
 * Dispatch must go through the Edge Function because match-generate enforces:
 * - JWT/internal authorization
 * - broker ownership
 * - hc_jobs preauth status
 * - canonical match_offers writes
 */
export async function POST(req: NextRequest) {
    try {
        const { load_id, job_id, wave = 1 } = await req.json();

        if (!load_id || !job_id) {
            return NextResponse.json({
                error: "load_id and canonical job_id are required for paid dispatch",
                canonical_required: true,
            }, { status: 400 });
        }

        const internalSecret = process.env.MATCHING_INTERNAL_SECRET;
        const internalToken = req.headers.get("x-internal-token");
        const internalAuthorized = Boolean(internalSecret && internalToken === internalSecret);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!internalAuthorized && !session?.access_token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) {
            return NextResponse.json({ error: "Supabase URL is not configured" }, { status: 500 });
        }

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (internalAuthorized && !serviceKey) {
            return NextResponse.json({ error: "Service role key is not configured for internal dispatch" }, { status: 500 });
        }

        const matchRes = await fetch(`${supabaseUrl}/functions/v1/match-generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${internalAuthorized ? serviceKey : session?.access_token}`,
                ...(internalAuthorized && internalSecret ? { "x-internal-token": internalSecret } : {}),
            },
            body: JSON.stringify({ load_id, job_id, wave }),
        });

        const data = asJsonRecord(await matchRes.json().catch(() => ({})));
        const candidates = arrayField(data, "matches").length > 0
            ? arrayField(data, "matches")
            : arrayField(data, "offers").length > 0
                ? arrayField(data, "offers")
                : arrayField(data, "candidates");

        const queueResult = await recordLoadMatchQueue({
            loadId: load_id,
            jobId: job_id,
            wave,
            candidates,
            source: "api_loads_dispatch",
            edgeStatus: matchRes.status,
            edgeOk: matchRes.ok,
            error: matchRes.ok ? null : stringField(data, "error") || "match_generate_failed",
        });

        return NextResponse.json({
            ...data,
            matching_queue_recorded: queueResult.recorded,
            matching_queue_rows_created: queueResult.rowsCreated,
            uncovered_alert_created: queueResult.uncoveredAlertCreated,
            matching_queue_errors: queueResult.errors,
        }, { status: matchRes.status });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
