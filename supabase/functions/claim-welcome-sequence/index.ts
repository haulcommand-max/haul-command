import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * claim-welcome-sequence — Triggered when an operator claims their profile
 *
 * Sends:
 *   1. Welcome + Facebook group invite email
 *   2. App download CTA
 *
 * Only fires for: is_claimed=true, has email, claim_events recorded
 */

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { persistSession: false } }
        );

        const body = await req.json().catch(() => ({}));
        const { profile_id, user_id, claim_hash } = body;

        if (!profile_id) {
            return json({ error: "profile_id required" }, 400);
        }

        // ── Verify claim actually happened ──
        const { data: profile } = await supabase
            .from("driver_profiles")
            .select("id, email, company_name, display_name, home_base_city, home_base_state, is_claimed")
            .eq("id", profile_id)
            .single();

        if (!profile || !profile.is_claimed) {
            return json({ error: "Profile not claimed" }, 400);
        }

        if (!profile.email) {
            return json({ skipped: true, reason: "no email on claimed profile" });
        }

        // ── Record claim event ──
        await supabase.from("claim_events").insert({
            profile_id,
            user_id: user_id || null,
            claim_hash: claim_hash || null,
            claim_method: "web",
        });

        // ── Stop seed claim sequence if active ──
        await supabase
            .from("email_sequences")
            .update({ status: "cancelled", completed_at: new Date().toISOString() })
            .eq("profile_id", profile_id)
            .eq("sequence_name", "seed_claim")
            .eq("status", "active");

        // ── Get Facebook group URL ──
        const { data: fbSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "facebook_group_url")
            .single();
        const fbGroupUrl = fbSetting?.value || "https://www.facebook.com/groups/haulcommand";

        const displayName = profile.company_name || profile.display_name || "Operator";
        const city = profile.home_base_city || "your area";
        const state = profile.home_base_state || "";
        const location = state ? `${city}, ${state}` : city;

        // ── Send welcome + group invite email ──
        await supabase.from("email_jobs").insert({
            to_email: profile.email,
            to_name: displayName,
            subject: `Welcome to Haul Command, ${displayName} 🎯`,
            template_id: "claim_welcome_group_invite",
            template_data: {
                display_name: displayName,
                city,
                state,
                location,
                facebook_group_url: fbGroupUrl,
                app_download_url: "https://haulcommand.com/app",
                dashboard_url: "https://haulcommand.com/dashboard",
            },
            status: "pending",
            priority: "high",
        });

        // ── Record welcome sequence ──
        await supabase.from("email_sequences").insert({
            profile_id,
            user_id: user_id || null,
            sequence_name: "claim_welcome",
            current_step: 1,
            max_steps: 1,
            status: "completed",
            last_step_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
        });

        console.log(`claim-welcome: sent to ${profile.email} (${displayName})`);
        return json({ success: true, profile_id, email_sent: true });
    } catch (err: any) {
        console.error("claim-welcome error:", err.message);
        return json({ error: err.message }, 500);
    }
});

function json(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
