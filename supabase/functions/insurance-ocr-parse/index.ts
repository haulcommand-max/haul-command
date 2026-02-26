// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Req = { insurance_doc_id: string };
type Res =
  | { ok: true; insurance_doc_id: string; status: "parsed" | "rejected"; expires_on?: string; limits?: Record<string, unknown> }
  | { ok: false; error: string };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();

    let body: Req;
    try {
        body = await req.json();
    } catch {
        const res: Res = { ok: false, error: "invalid json" };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const { data: doc, error: fetchErr } = await supabase
        .from("insurance_docs")
        .select("*")
        .eq("id", body.insurance_doc_id)
        .single();

    if (fetchErr || !doc) {
        const res: Res = { ok: false, error: "insurance_doc not found" };
        return new Response(JSON.stringify(res), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── OCR / extraction ────────────────────────────────────────────────────
    // Replace this stub with your OCR provider call (e.g., Google Document AI,
    // AWS Textract, or an LLM-based extraction endpoint).
    // Expected: doc already has pre-filled fields from the upload form, or
    // the OCR result is injected here.
    const parsed = {
        insured_name:  doc.insured_name ?? null,
        policy_number: doc.policy_number ?? null,
        expires_on:    doc.expires_on ?? null,
        limits:        doc.limits ?? {},
        producer:      doc.producer ?? {},
        confidence:    0.85,
        warnings:      [] as string[],
    };

    // Validation gate: reject if no expiry or no coverage limits
    const expiresOn: string | null = parsed.expires_on;
    const glLimit   = (parsed.limits as Record<string, number>)?.gl ?? 0;
    const autoLimit = (parsed.limits as Record<string, number>)?.auto ?? 0;
    const isRejected = !expiresOn || (glLimit <= 0 && autoLimit <= 0);
    const nextStatus = isRejected ? "rejected" : "parsed";

    await supabase
        .from("insurance_docs")
        .update({
            status:        nextStatus,
            parsed,
            insured_name:  parsed.insured_name,
            policy_number: parsed.policy_number,
            expires_on:    expiresOn,
            limits:        parsed.limits,
            producer:      parsed.producer,
        })
        .eq("id", body.insurance_doc_id);

    // ── Schedule reminders at -30 / -14 / -3 days ────────────────────────
    if (!isRejected && expiresOn) {
        const expiryMs = new Date(expiresOn + "T00:00:00Z").getTime();
        for (const daysBefore of [30, 14, 3]) {
            const runAt = new Date(expiryMs - daysBefore * 86_400_000).toISOString();
            await supabase.from("compliance_reminders").insert({
                actor_type: "driver",
                actor_id:   doc.profile_id,
                kind:       "insurance_expiring",
                due_at:     runAt,
                run_at:     runAt,
                ref_table:  "insurance_docs",
                ref_id:     doc.id,
                status:     "pending",
                payload:    { days_before: daysBefore, expires_on: expiresOn },
            });
        }
    }

    // ── Audit event ───────────────────────────────────────────────────────
    await supabase.from("event_log").insert({
        actor_profile_id: doc.profile_id,
        actor_role:       "driver",
        event_type:       "insurance.parsed",
        entity_type:      "insurance_docs",
        entity_id:        doc.id,
        payload:          { status: nextStatus, expires_on: expiresOn },
    });

    const res: Res = { ok: true, insurance_doc_id: doc.id, status: nextStatus as "parsed" | "rejected", expires_on: expiresOn ?? undefined, limits: parsed.limits as Record<string, unknown> };
    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
