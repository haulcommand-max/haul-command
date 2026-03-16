/**
 * Evidence Vault API
 * GET  /api/admin/trust/evidence?entity_id=...  — get evidence records  
 * POST /api/admin/trust/evidence                — log new evidence
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { logEvidence, getEntityEvidence, type EvidenceRecord } from "@/lib/trust/evidence-vault";

const ADMIN_SECRET = process.env.HC_ADMIN_SECRET;

function isAuthed(req: NextRequest): boolean {
    const auth = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    return !!ADMIN_SECRET && auth === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
    if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entityId = req.nextUrl.searchParams.get("entity_id");
    if (!entityId) return NextResponse.json({ error: "entity_id required" }, { status: 400 });

    try {
        const records = await getEntityEvidence(entityId);
        return NextResponse.json({ ok: true, entity_id: entityId, records, count: records.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { entityId, fieldName, value, sourceUrl, contentHash, snapshotPointer, confidenceScore, verificationMethod } = body;

        if (!entityId || !fieldName || !sourceUrl) {
            return NextResponse.json({ error: "entityId, fieldName, sourceUrl required" }, { status: 400 });
        }

        const id = await logEvidence({
            entityId,
            fieldName,
            value,
            sourceUrl,
            fetchTimestampISO: new Date().toISOString(),
            contentHash: contentHash || "",
            snapshotPointer,
            confidenceScore: confidenceScore ?? 0.5,
            verificationMethod: verificationMethod || "SCRAPE_MATCH",
        });

        return NextResponse.json({ ok: true, evidence_id: id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
