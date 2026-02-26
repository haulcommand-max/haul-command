import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * seed-claim-sequence — Sends multi-step claim emails to seeded operators
 *
 * Gated by:
 *   - seed_launch_enabled = 'true'
 *   - now() >= seed_launch_at
 *
 * Sequence:
 *   Step 1 (Day 0):  "Your listing is live in {city} — claim it"
 *   Step 2 (+3 days): "Brokers searched your area — claim to be seen"
 *   Step 3 (+10 days): "Claim or lose your territory"
 *
 * Only sends to: is_seeded=true, is_claimed=false, email exists, not suppressed
 */

const STEP_DELAYS_MS = [
    0,                          // Step 1: immediate after gate opens
    3 * 24 * 60 * 60 * 1000,   // Step 2: +3 days
    10 * 24 * 60 * 60 * 1000,  // Step 3: +10 days
];

serve(async (_req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { auth: { persistSession: false } }
        );

        // ── Gate check ──
        const { data: launchEnabled } = await supabase
            .from("app_settings").select("value").eq("key", "seed_launch_enabled").single();
        const { data: launchAt } = await supabase
            .from("app_settings").select("value").eq("key", "seed_launch_at").single();

        if (launchEnabled?.value !== "true") {
            return json({ skipped: true, reason: "seed_launch_enabled is false" });
        }

        const launchDate = new Date(launchAt?.value || "2026-02-26T09:00:00-05:00");
        if (Date.now() < launchDate.getTime()) {
            return json({ skipped: true, reason: `Before launch date: ${launchDate.toISOString()}` });
        }

        console.log("seed-claim-sequence: gate open, processing...");

        // ── Find eligible profiles (seeded, unclaimed, has email, not suppressed) ──
        const { data: profiles, error: profErr } = await supabase
            .from("driver_profiles")
            .select("id, email, company_name, display_name, home_base_city, home_base_state, claim_hash")
            .eq("is_seeded", true)
            .eq("is_claimed", false)
            .not("email", "is", null)
            .limit(200);

        if (profErr) throw profErr;
        if (!profiles || profiles.length === 0) {
            return json({ processed: 0, reason: "no eligible profiles" });
        }

        // ── Check existing sequences ──
        const profileIds = profiles.map(p => p.id);
        const { data: existingSeqs } = await supabase
            .from("email_sequences")
            .select("profile_id, current_step, status, next_step_at")
            .eq("sequence_name", "seed_claim")
            .in("profile_id", profileIds);

        const seqMap = new Map((existingSeqs || []).map(s => [s.profile_id, s]));

        // ── Check suppression ──
        const emails = profiles.map(p => p.email).filter(Boolean);
        const { data: suppressed } = await supabase
            .from("email_suppression")
            .select("email")
            .in("email", emails);
        const suppressedSet = new Set((suppressed || []).map(s => s.email));

        let sent = 0;
        let skipped = 0;

        for (const profile of profiles) {
            if (!profile.email || suppressedSet.has(profile.email)) {
                skipped++;
                continue;
            }

            const existing = seqMap.get(profile.id);
            const displayName = profile.company_name || profile.display_name || "Operator";
            const city = profile.home_base_city || "your area";
            const state = profile.home_base_state || "";
            const claimUrl = profile.claim_hash
                ? `https://haulcommand.com/claim/${profile.claim_hash}`
                : `https://haulcommand.com/claim/${profile.id}`;

            if (!existing) {
                // Start sequence — Step 1
                await sendStep(supabase, profile, 1, displayName, city, state, claimUrl);

                await supabase.from("email_sequences").insert({
                    profile_id: profile.id,
                    sequence_name: "seed_claim",
                    current_step: 1,
                    max_steps: 3,
                    status: "active",
                    last_step_at: new Date().toISOString(),
                    next_step_at: new Date(Date.now() + STEP_DELAYS_MS[1]).toISOString(),
                });
                sent++;
            } else if (existing.status === "active" && existing.next_step_at) {
                const nextAt = new Date(existing.next_step_at).getTime();
                if (Date.now() >= nextAt && existing.current_step < 3) {
                    const nextStep = existing.current_step + 1;
                    await sendStep(supabase, profile, nextStep, displayName, city, state, claimUrl);

                    const isLast = nextStep >= 3;
                    await supabase.from("email_sequences")
                        .update({
                            current_step: nextStep,
                            last_step_at: new Date().toISOString(),
                            next_step_at: isLast ? null : new Date(Date.now() + STEP_DELAYS_MS[nextStep]).toISOString(),
                            status: isLast ? "completed" : "active",
                            completed_at: isLast ? new Date().toISOString() : null,
                        })
                        .eq("profile_id", profile.id)
                        .eq("sequence_name", "seed_claim");
                    sent++;
                } else {
                    skipped++;
                }
            } else {
                skipped++;
            }
        }

        console.log(`seed-claim-sequence: sent=${sent} skipped=${skipped}`);
        return json({ success: true, sent, skipped });
    } catch (err: any) {
        console.error("seed-claim-sequence error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});

async function sendStep(
    supabase: any,
    profile: any,
    step: number,
    displayName: string,
    city: string,
    state: string,
    claimUrl: string,
) {
    const location = state ? `${city}, ${state}` : city;
    const templates: Record<number, { subject: string; template: string }> = {
        1: {
            subject: `${displayName} — Your listing is live in ${location}`,
            template: "seed_claim_step1",
        },
        2: {
            subject: `Brokers searched ${location} — they can't find you yet`,
            template: "seed_claim_step2",
        },
        3: {
            subject: `Last call: Claim your territory in ${location}`,
            template: "seed_claim_step3",
        },
    };

    const t = templates[step];
    if (!t) return;

    // Enqueue via email-send
    await supabase.from("email_jobs").insert({
        to_email: profile.email,
        to_name: displayName,
        subject: t.subject,
        template_id: t.template,
        template_data: {
            display_name: displayName,
            city,
            state,
            location,
            claim_url: claimUrl,
            app_download_url: "https://haulcommand.com/app",
            step,
        },
        status: "pending",
        priority: step === 1 ? "high" : "normal",
    });
}

function json(data: any) {
    return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
    });
}
