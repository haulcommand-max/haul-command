import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * email-send — Single transactional send endpoint
 * 
 * Enqueues an email into email_jobs (does NOT send directly).
 * Checks: suppression list, user preferences, fatigue caps, quiet hours, dedupe.
 * 
 * POST body: { user_id, to_email, template_key, payload, dedupe_key?, send_after? }
 */
serve(async (req) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const body = await req.json();
        const { user_id, to_email, template_key, payload, dedupe_key, send_after } = body;

        if (!to_email || !template_key) {
            return new Response(JSON.stringify({ error: "Missing to_email or template_key" }), { status: 400, headers });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── 1. Feature flag check ──
        const featureKey = getFeatureFlag(template_key);
        if (featureKey) {
            const { data: flag } = await supabase.from("app_settings").select("value").eq("key", featureKey).single();
            if (flag?.value !== "true") {
                return new Response(JSON.stringify({ queued: false, reason: `Feature disabled: ${featureKey}` }), { status: 200, headers });
            }
        }

        // ── 2. Suppression check ──
        const { data: suppressed } = await supabase
            .from("email_suppression")
            .select("email")
            .eq("email", to_email.toLowerCase())
            .maybeSingle();

        if (suppressed) {
            await logEvent(supabase, user_id, to_email, "suppressed", template_key, { reason: "suppression_list" });
            return new Response(JSON.stringify({ queued: false, reason: "Email suppressed" }), { status: 200, headers });
        }

        // ── 3. User preference check ──
        if (user_id) {
            const prefField = getPrefField(template_key);
            if (prefField) {
                const { data: prefs } = await supabase
                    .from("email_preferences")
                    .select(prefField)
                    .eq("user_id", user_id)
                    .single();

                if (prefs && prefs[prefField] === false) {
                    await logEvent(supabase, user_id, to_email, "suppressed", template_key, { reason: `pref_disabled:${prefField}` });
                    return new Response(JSON.stringify({ queued: false, reason: `User opted out: ${prefField}` }), { status: 200, headers });
                }
            }
        }

        // ── 4. Daily fatigue cap ──
        if (user_id) {
            const { data: capSetting } = await supabase.from("app_settings").select("value").eq("key", "email.daily_cap_per_user").single();
            const dailyCap = parseInt(capSetting?.value || "3", 10);

            const todayStart = new Date();
            todayStart.setUTCHours(0, 0, 0, 0);

            const { count } = await supabase
                .from("email_events")
                .select("*", { count: "exact", head: true })
                .eq("user_id", user_id)
                .eq("event_type", "sent")
                .gte("created_at", todayStart.toISOString());

            if ((count || 0) >= dailyCap) {
                await logEvent(supabase, user_id, to_email, "suppressed", template_key, { reason: `daily_cap:${dailyCap}` });
                return new Response(JSON.stringify({ queued: false, reason: `Daily cap reached (${dailyCap})` }), { status: 200, headers });
            }
        }

        // ── 5. Quiet hours delay ──
        let effectiveSendAfter = send_after ? new Date(send_after) : new Date();

        const { data: qhStart } = await supabase.from("app_settings").select("value").eq("key", "email.quiet_hours_start").single();
        const { data: qhEnd } = await supabase.from("app_settings").select("value").eq("key", "email.quiet_hours_end").single();

        const quietStart = parseInt((qhStart?.value || "21").split(":")[0], 10);
        const quietEnd = parseInt((qhEnd?.value || "07").split(":")[0], 10);
        const nowHour = new Date().getUTCHours();

        if (isQuietHour(nowHour, quietStart, quietEnd) && !send_after) {
            // Delay until quiet hours end
            const delayed = new Date();
            delayed.setUTCHours(quietEnd, 0, 0, 0);
            if (delayed <= new Date()) delayed.setUTCDate(delayed.getUTCDate() + 1);
            effectiveSendAfter = delayed;
        }

        // ── 6. Enqueue ──
        const { data: job, error: insertErr } = await supabase
            .from("email_jobs")
            .insert({
                user_id: user_id || null,
                to_email: to_email.toLowerCase(),
                template_key,
                payload: payload || {},
                send_after: effectiveSendAfter.toISOString(),
                dedupe_key: dedupe_key || null,
                status: "pending",
            })
            .select("id")
            .single();

        if (insertErr) {
            // Dedupe conflict — not an error
            if (insertErr.code === "23505") {
                return new Response(JSON.stringify({ queued: false, reason: "Duplicate (deduped)" }), { status: 200, headers });
            }
            throw insertErr;
        }

        await logEvent(supabase, user_id, to_email, "queued", template_key, { job_id: job.id });

        return new Response(JSON.stringify({ queued: true, job_id: job.id }), { status: 200, headers });
    } catch (err) {
        console.error("[email-send] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
});

// ─── Helpers ─────────────────────────────────────────────────────

function getFeatureFlag(templateKey: string): string | null {
    const map: Record<string, string> = {
        welcome_claim: "email.enable_transactional",
        claim_nudge_2: "email.enable_claim_nudges",
        claim_nudge_3: "email.enable_claim_nudges",
        viewed_you: "email.enable_viewed_you",
        report_card_ready: "email.enable_transactional",
        panic_fill_alert: "email.enable_transactional",
        monthly_digest: "email.enable_digests",
    };
    return map[templateKey] || "email.enable_transactional";
}

function getPrefField(templateKey: string): string | null {
    const map: Record<string, string> = {
        viewed_you: "viewed_you",
        claim_nudge_2: "claim_reminders",
        claim_nudge_3: "claim_reminders",
        monthly_digest: "newsletter_opt_in",
    };
    return map[templateKey] || null;
}

function isQuietHour(current: number, start: number, end: number): boolean {
    if (start < end) return current >= start && current < end;
    return current >= start || current < end;
}

async function logEvent(
    supabase: any,
    userId: string | null,
    email: string,
    eventType: string,
    templateKey: string,
    meta: Record<string, any> = {}
) {
    await supabase.from("email_events").insert({
        user_id: userId || null,
        email: email.toLowerCase(),
        event_type: eventType,
        template_key: templateKey,
        meta,
    });
}
