import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * email-claim-nudges — Claim listing pipeline with escalating DR copy.
 * 
 * Cron: every 6 hours
 * Gated by: email.enable_claim_nudges
 * 
 * Strategy:
 *   nudge_1: immediate after seed/import
 *   nudge_2: +3 days
 *   nudge_3: +7 days
 *   nudge_4: +14 days then STOP (avoid annoyance)
 */

const NUDGE_INTERVALS_DAYS = [0, 3, 7, 14]; // nudge 1-4

serve(async (_req) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Gate check ──
        const { data: flag } = await supabase
            .from("app_settings").select("value").eq("key", "email.enable_claim_nudges").single();
        if (flag?.value !== "true") {
            return new Response(JSON.stringify({ skipped: true, reason: "Claim nudges disabled" }), { headers });
        }

        console.log("[email-claim-nudges] Scanning for due nudges...");

        // ── Find listings ready for next nudge ──
        const { data: dueNudges, error: fetchErr } = await supabase
            .from("directory_claim_state")
            .select("*")
            .not("claim_status", "in", '("claimed","expired")')
            .lte("next_nudge_at", new Date().toISOString())
            .limit(100);

        if (fetchErr) throw fetchErr;
        if (!dueNudges || dueNudges.length === 0) {
            return new Response(JSON.stringify({ processed: 0 }), { headers });
        }

        let sent = 0;
        let stopped = 0;

        for (const state of dueNudges) {
            const nudgeNum = state.nudge_count + 1;

            // ── Stop after nudge 4 ──
            if (nudgeNum > 4) {
                await supabase.from("directory_claim_state").update({
                    claim_status: "expired",
                    updated_at: new Date().toISOString(),
                }).eq("listing_type", state.listing_type).eq("listing_id", state.listing_id);
                stopped++;
                continue;
            }

            // ── Get the claim token for this listing ──
            const { data: token } = await supabase
                .from("listing_claim_tokens")
                .select("email, token")
                .eq("listing_type", state.listing_type)
                .eq("listing_id", state.listing_id)
                .is("used_at", null)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!token) {
                stopped++;
                continue;
            }

            // ── Check suppression ──
            const { data: suppressed } = await supabase
                .from("email_suppression")
                .select("email")
                .eq("email", token.email.toLowerCase())
                .maybeSingle();

            if (suppressed) {
                await supabase.from("directory_claim_state").update({
                    claim_status: "expired",
                    updated_at: new Date().toISOString(),
                }).eq("listing_type", state.listing_type).eq("listing_id", state.listing_id);
                stopped++;
                continue;
            }

            // ── Pick template key based on nudge number ──
            const templateKey = nudgeNum === 1 ? "welcome_claim" :
                nudgeNum === 2 ? "claim_nudge_2" :
                    "claim_nudge_3"; // nudge 3 & 4 use same template with different payload

            // ── Get view count for social proof ──
            const { count: viewCount } = await supabase
                .from("directory_views")
                .select("*", { count: "exact", head: true })
                .eq("profile_id", state.listing_id);

            const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://haulcommand.com";
            const claimUrl = `${appUrl}/claim/${token.token}`;

            // ── Enqueue email ──
            await supabase.from("email_jobs").insert({
                to_email: token.email.toLowerCase(),
                template_key: templateKey,
                payload: {
                    claim_url: claimUrl,
                    view_count: viewCount || 0,
                    nudge_number: nudgeNum,
                    listing_type: state.listing_type,
                },
                dedupe_key: `claim_nudge:${state.listing_id}:${nudgeNum}`,
                status: "pending",
            });

            // ── Update state machine ──
            const nextNudgeIdx = nudgeNum; // next nudge number (0-indexed from NUDGE_INTERVALS_DAYS)
            const nextIntervalDays = NUDGE_INTERVALS_DAYS[nextNudgeIdx] || null;
            const nextNudgeAt = nextIntervalDays !== null
                ? new Date(Date.now() + nextIntervalDays * 86400000).toISOString()
                : null;

            await supabase.from("directory_claim_state").update({
                claim_status: `nudge_${nudgeNum}`,
                nudge_count: nudgeNum,
                last_nudge_at: new Date().toISOString(),
                next_nudge_at: nextNudgeAt,
                updated_at: new Date().toISOString(),
            }).eq("listing_type", state.listing_type).eq("listing_id", state.listing_id);

            sent++;
        }

        console.log(`[email-claim-nudges] Sent: ${sent}, Stopped: ${stopped}`);
        return new Response(JSON.stringify({ processed: dueNudges.length, sent, stopped }), { headers });
    } catch (err) {
        console.error("[email-claim-nudges] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
});
