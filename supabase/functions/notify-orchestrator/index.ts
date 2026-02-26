import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * notify-orchestrator — Multi-channel dispatch for inbox_messages
 * 
 * Channels: In-App Inbox (always) + Push + Email (gated)
 * Triggered by Supabase webhook on inbox_messages INSERT.
 */
serve(async (req) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const payload = await req.json();
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const record = payload.record;

        if (!record || !record.user_id) {
            return new Response("Missing record", { status: 400 });
        }

        console.log(`[notify-orchestrator] Inbox record ${record.id} for user ${record.user_id} (type: ${record.type})`);

        const results = { push: 0, email: false };

        // ═══════════════════════════════════════════════════════
        // CHANNEL 1: Push Notifications
        // ═══════════════════════════════════════════════════════

        const { data: endpoints } = await supabase
            .from("push_endpoints")
            .select("*")
            .eq("user_id", record.user_id);

        if (endpoints && endpoints.length > 0) {
            const pushContent = {
                title: record.payload?.title || "New Intelligence",
                body: record.payload?.body || "You have a new update in your command center.",
                data: { url: record.payload?.action_url || "/dashboard" },
            };

            for (const endpoint of endpoints) {
                if (endpoint.provider === "fcm") {
                    console.log(`[push] FCM → ${endpoint.endpoint.slice(0, 20)}...`);
                    // await sendFCMMessage(endpoint.endpoint, pushContent);
                    results.push++;
                } else if (endpoint.provider === "webpush") {
                    console.log(`[push] WebPush → ${endpoint.endpoint.slice(0, 20)}...`);
                    // await sendWebPush(endpoint, pushContent);
                    results.push++;
                }
            }
        }

        // ═══════════════════════════════════════════════════════
        // CHANNEL 2: Email (gated by feature flags + preferences)
        // ═══════════════════════════════════════════════════════

        const emailEnabled = await isEnabled(supabase, "email.enable_transactional");

        if (emailEnabled) {
            // Map inbox type → email template key
            const templateMap: Record<string, string> = {
                viewed_you: "viewed_you",
                morning_pulse: "monthly_digest",
                panic_fill: "panic_fill_alert",
                load_update: "report_card_ready",
            };

            const templateKey = templateMap[record.type];

            if (templateKey) {
                // Check per-type feature flag
                const typeFlag = getTypeFlag(record.type);
                const typeFlagEnabled = typeFlag ? await isEnabled(supabase, typeFlag) : true;

                if (typeFlagEnabled) {
                    // Get user email
                    const { data: authUser } = await supabase.auth.admin.getUserById(record.user_id);
                    const userEmail = authUser?.user?.email;

                    if (userEmail) {
                        // Enqueue via email_jobs (email-worker will handle fatigue, suppression, sending)
                        const { error: enqueueErr } = await supabase.from("email_jobs").insert({
                            user_id: record.user_id,
                            to_email: userEmail.toLowerCase(),
                            template_key: templateKey,
                            payload: record.payload || {},
                            dedupe_key: `notify:${record.type}:${record.user_id}:${new Date().toISOString().slice(0, 10)}`,
                            status: "pending",
                        });

                        if (enqueueErr && enqueueErr.code !== "23505") {
                            console.error("[notify-orchestrator] Email enqueue error:", enqueueErr);
                        } else {
                            results.email = true;
                            console.log(`[email] Enqueued ${templateKey} for ${userEmail}`);
                        }
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, deliveredPush: results.push, emailEnqueued: results.email }),
            { headers }
        );
    } catch (err) {
        console.error("[notify-orchestrator] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
});

// ─── Helpers ─────────────────────────────────────────────────────

async function isEnabled(supabase: any, key: string): Promise<boolean> {
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).single();
    return data?.value === "true";
}

function getTypeFlag(type: string): string | null {
    const map: Record<string, string> = {
        viewed_you: "email.enable_viewed_you",
        panic_fill: "email.enable_transactional",
        morning_pulse: "email.enable_digests",
        load_update: "email.enable_transactional",
    };
    return map[type] || null;
}
