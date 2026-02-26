import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type RunReq = {
    max_missions?: number;
    dry_run?: boolean;
};

function nowISO() { return new Date().toISOString(); }

serve(async (req) => {
    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

        const body = (await req.json().catch(() => ({}))) as RunReq;
        const max = Math.min(Math.max(body.max_missions ?? 5, 1), 20);
        const dry = body.dry_run ?? true;

        // --- RECRUITER BRAIN BOOST CONFIG (YAML Override) ---
        const BRAIN_BOOST = {
            enabled: true,
            runner: {
                schedule_minutes: 30,
                concurrency_max: 2,
                per_region_daily_cap: 1200,
                cooldown_hours: 12
            },
            quality: {
                phone_normalize_e164: true,
                dedupe_threshold: 0.92,
                spam_score_max: 0.35
            },
            compliance: {
                opt_out_enforced: true,
                quiet_hours_local: ["21:00-08:00"]
            },
            outreach: {
                channels_priority: ["sms", "email"],
                provider: {
                    sms: "twilio_optional",
                    email: "listmonk_or_resend"
                }
            }
        };

        // Enforce quiet hours (basic check)
        const d = new Date();
        const hour = d.getUTCHours() - 5; // Assuming EST for baseline
        const localHour = hour < 0 ? hour + 24 : hour;
        if (BRAIN_BOOST.compliance.opt_out_enforced && (localHour >= 21 || localHour < 8)) {
            return new Response(JSON.stringify({ ok: true, skipped: "Quiet hours active (21:00-08:00)" }), {
                headers: { "content-type": "application/json" },
            });
        }


        // 1) Pull queued missions
        const { data: missions, error: mErr } = await sb
            .from("recruit_missions")
            .select("*")
            .eq("status", "queued")
            .or(`cooldown_until.is.null,cooldown_until.lte.${nowISO()}`)
            .order("priority", { ascending: false })
            .limit(max);

        if (mErr) throw mErr;

        const results: any[] = [];

        for (const mission of (missions ?? [])) {
            const missionId = mission.id as string;

            // mark running
            await sb.from("recruit_missions").update({
                status: "running",
                started_at: mission.started_at ?? nowISO(),
                last_error: null,
            }).eq("id", missionId);

            // 2) Strategy: assign unclaimed seed numbers first (fastest win)
            const country = mission.country;
            const region = mission.region;

            const { data: targets, error: tErr } = await sb
                .from("driver_profiles")
                .select("id, phone_hash, availability_status")
                .eq("availability_status", "seed_unclaimed")
                .maybeSingle();

            if (tErr) {
                await sb.from("recruit_missions").update({
                    status: "failed",
                    last_error: `Targeting query failed: ${String(tErr.message ?? tErr)}`,
                    completed_at: nowISO(),
                }).eq("id", missionId);

                results.push({ mission_id: missionId, ok: false, error: "targeting_query_failed" });
                continue;
            }

            // 3) Simulated outcome (dry-run)
            if (dry) {
                await sb.from("recruit_missions").update({
                    status: "completed",
                    completed_at: nowISO(),
                    cooldown_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
                }).eq("id", missionId);

                results.push({ mission_id: missionId, ok: true, dry_run: true });
                continue;
            }

            // 4) Execute real sequence
            if (targets && targets.id) {
                await sb.from("recruit_outreach_events").insert({
                    mission_id: missionId,
                    channel: "sms",
                    status: "queued",
                    operator_id: targets.id,
                    template_key: "claim_profile_sms_v1",
                    payload: { country, region, created_at: nowISO() },
                });
            }

            await sb.from("recruit_missions").update({
                status: "completed",
                completed_at: nowISO(),
                cooldown_until: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
            }).eq("id", missionId);

            results.push({ mission_id: missionId, ok: true, dry_run: false });
        }

        return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
            headers: { "content-type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
});
