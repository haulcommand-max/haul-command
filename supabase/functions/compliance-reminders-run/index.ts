// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Json = Record<string, unknown>;
type Res = { ok: true; processed: number; skipped: number } | { ok: false; error: string };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();
    const body: Json = await req.json().catch(() => ({}));
    const now = new Date();
    const horizonDays = Number(body.horizonDays ?? 14);

    // ── Legacy compat: create a single profile_incomplete reminder ────────
    if (body.actorId) {
        const dueAt = new Date(now.getTime() + horizonDays * 86_400_000).toISOString();
        const { error } = await supabase.from("compliance_reminders").insert([{
            actor_type: "driver",
            actor_id: body.actorId,
            kind: "profile_incomplete",
            due_at: dueAt,
            run_at: dueAt,
            status: "pending",
            payload: { reason: "missing_required_fields" },
        }]);
        if (error) {
            return new Response(JSON.stringify({ ok: false, error: error.message } satisfies Res), {
                headers: { ...corsHeaders, "content-type": "application/json" }, status: 500,
            });
        }
        return new Response(JSON.stringify({ ok: true, processed: 1, skipped: 0 } satisfies Res), {
            headers: { ...corsHeaders, "content-type": "application/json" },
        });
    }

    // ── Standard mode: dispatch pending/queued reminders due now ─────────
    const limit = Math.min(Number(body.limit ?? 200), 500);

    const { data: rows, error: fetchErr } = await supabase
        .from("compliance_reminders")
        .select("*")
        .in("status", ["pending", "queued"])
        .lte("due_at", now.toISOString())
        .order("due_at", { ascending: true })
        .limit(limit);

    if (fetchErr) {
        return new Response(JSON.stringify({ ok: false, error: fetchErr.message } satisfies Res), {
            headers: { ...corsHeaders, "content-type": "application/json" }, status: 500,
        });
    }

    let processed = 0;
    let skipped = 0;

    for (const r of rows ?? []) {
        // TODO: wire to FCM via notification_events:
        //   await supabase.from("notification_events").insert({
        //     user_id: r.actor_id, type: r.kind, title: ..., body: ...
        //   });

        const { error: updateErr } = await supabase
            .from("compliance_reminders")
            .update({ status: "sent", sent_at: now.toISOString() })
            .eq("id", r.id);

        if (updateErr) {
            await supabase.from("compliance_reminders").update({ status: "failed" }).eq("id", r.id);
            skipped++;
            continue;
        }

        // Emit event for analytics / audit.
        // Fire-and-forget: if event_log doesn't exist yet (migration 0027 not applied),
        // reminder dispatch still succeeds — the audit write is non-blocking.
        void (async () => {
            try {
                await supabase.from("event_log").insert({
                    actor_profile_id: r.actor_id,
                    actor_role: r.actor_type ?? "driver",
                    event_type: "reminder.sent",
                    entity_type: r.ref_table ?? "compliance_reminders",
                    entity_id: r.ref_id ?? r.id,
                    payload: { kind: r.kind, days_before: (r.payload as Json)?.days_before ?? null },
                });
            } catch { /* graceful: table may not exist yet */ }
        })();

        processed++;
    }

    return new Response(JSON.stringify({ ok: true, processed, skipped } satisfies Res), {
        headers: { ...corsHeaders, "content-type": "application/json" },
    });
});
