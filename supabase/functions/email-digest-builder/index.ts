import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * email-digest-builder — Builds monthly digest content from existing views.
 * 
 * Cron: 0 14 1 * * (2pm on the 1st of every month)
 * Gated by: email.enable_digests
 * 
 * Queries:
 *   v_corridor_report_card, v_driver_report_card,
 *   v_market_liquidity, v_corridor_leaderboard, corridor_incidents
 * 
 * Creates a listmonk campaign OR enqueues individual email_jobs.
 */
serve(async (_req) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── Gate check ──
        const { data: flag } = await supabase
            .from("app_settings").select("value").eq("key", "email.enable_digests").single();
        if (flag?.value !== "true") {
            return new Response(JSON.stringify({ skipped: true, reason: "Digests disabled" }), { headers });
        }

        console.log("[email-digest-builder] Building monthly digest...");

        // ── 1. Market Pulse (what changed this month) ──
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

        const { data: corridorStats } = await supabase
            .from("v_corridor_report_card")
            .select("corridor_name, avg_rate, load_count, risk_tier")
            .order("load_count", { ascending: false })
            .limit(5);

        // ── 2. Hot Corridors (where demand is rising) ──
        const { data: hotCorridors } = await supabase
            .from("v_market_liquidity")
            .select("corridor, demand_score, supply_gap")
            .order("demand_score", { ascending: false })
            .limit(5);

        // ── 3. Leaderboard Movers ──
        const { data: leaderboard } = await supabase
            .from("v_corridor_leaderboard")
            .select("operator_name, rank, score, corridor")
            .order("score", { ascending: false })
            .limit(10);

        // ── 4. Incidents ──
        const { data: incidents } = await supabase
            .from("corridor_incidents")
            .select("corridor, incident_type, severity")
            .gte("created_at", thirtyDaysAgo)
            .order("severity", { ascending: false })
            .limit(5);

        // ── Build HTML digest ──
        const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

        const digestHtml = buildDigestHtml({
            month,
            corridorStats: corridorStats || [],
            hotCorridors: hotCorridors || [],
            leaderboard: leaderboard || [],
            incidents: incidents || [],
        });

        // ── 5. Enqueue for all users with newsletter_opt_in ──
        const { data: subscribers } = await supabase
            .from("email_preferences")
            .select("user_id")
            .eq("newsletter_opt_in", true)
            .in("digest_frequency", ["monthly"]);

        if (!subscribers || subscribers.length === 0) {
            return new Response(JSON.stringify({ skipped: true, reason: "No subscribers" }), { headers });
        }

        // Get user emails
        let enqueued = 0;
        for (const sub of subscribers) {
            const { data: user } = await supabase.auth.admin.getUserById(sub.user_id);
            if (!user?.user?.email) continue;

            // Enqueue via email-send pattern
            await supabase.from("email_jobs").insert({
                user_id: sub.user_id,
                to_email: user.user.email,
                template_key: "monthly_digest",
                payload: { body: digestHtml, month },
                dedupe_key: `monthly_digest:${sub.user_id}:${month}`,
                status: "pending",
            });
            enqueued++;
        }

        console.log(`[email-digest-builder] Enqueued ${enqueued} digests for ${month}`);
        return new Response(JSON.stringify({ success: true, enqueued, month }), { headers });
    } catch (err) {
        console.error("[email-digest-builder] Error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
});

// ─── HTML Builder ────────────────────────────────────────────────

function buildDigestHtml(data: {
    month: string;
    corridorStats: any[];
    hotCorridors: any[];
    leaderboard: any[];
    incidents: any[];
}): string {
    const { month, corridorStats, hotCorridors, leaderboard, incidents } = data;

    const corridorRows = corridorStats.map(c => `
        <tr>
            <td style="padding:8px 12px;color:#fff;font-size:13px;border-bottom:1px solid #1a1c14;">${c.corridor_name}</td>
            <td style="padding:8px 12px;color:#4ade80;font-size:13px;text-align:right;border-bottom:1px solid #1a1c14;">$${c.avg_rate || '—'}</td>
            <td style="padding:8px 12px;color:#9ca3af;font-size:13px;text-align:right;border-bottom:1px solid #1a1c14;">${c.load_count} loads</td>
        </tr>`).join("");

    const hotRows = hotCorridors.map(h => `
        <div style="display:inline-block;background:#1a1c14;border:1px solid #2c3d1b;color:#4ade80;font-size:12px;padding:6px 12px;border-radius:20px;margin:3px;">
            🔥 ${h.corridor} (${h.demand_score?.toFixed(1) || '?'})
        </div>`).join("");

    const leaderRows = leaderboard.slice(0, 5).map((l, i) => `
        <tr>
            <td style="padding:6px 12px;color:#C6923A;font-weight:800;font-size:14px;border-bottom:1px solid #1a1c14;">#${i + 1}</td>
            <td style="padding:6px 12px;color:#fff;font-size:13px;border-bottom:1px solid #1a1c14;">${l.operator_name}</td>
            <td style="padding:6px 12px;color:#9ca3af;font-size:12px;text-align:right;border-bottom:1px solid #1a1c14;">${l.corridor}</td>
        </tr>`).join("");

    return `
    <!-- Section 1: Market Pulse -->
    <h2 style="color:#C6923A;font-size:18px;margin:0 0 12px;font-weight:800;">📡 Market Pulse</h2>
    <p style="color:#9ca3af;font-size:13px;margin:0 0 12px;">Here's what moved the needle in ${month}.</p>
    <table role="presentation" width="100%" style="background:#0a0b07;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${corridorRows || '<tr><td style="padding:12px;color:#6b7280;">No corridor data yet.</td></tr>'}
    </table>

    <!-- Section 2: Hot Corridors -->
    <h2 style="color:#C6923A;font-size:18px;margin:0 0 12px;font-weight:800;">🔥 Hot Corridors</h2>
    <div style="margin-bottom:24px;">${hotRows || '<span style="color:#6b7280;">No demand spikes detected.</span>'}</div>

    <!-- Section 3: Leaderboard Movers -->
    <h2 style="color:#C6923A;font-size:18px;margin:0 0 12px;font-weight:800;">🏆 Leaderboard Movers</h2>
    <table role="presentation" width="100%" style="background:#0a0b07;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${leaderRows || '<tr><td style="padding:12px;color:#6b7280;">Rankings pending.</td></tr>'}
    </table>

    <!-- Section 4: Operator Edge Tip -->
    <h2 style="color:#C6923A;font-size:18px;margin:0 0 12px;font-weight:800;">💡 Operator Edge</h2>
    <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 24px;">
        <strong style="color:#fff;">Pro tip:</strong> Drivers who respond to matches within 5 minutes 
        see 2.4x more repeat offers from the same brokers. Speed is trust.
    </p>

    <!-- Section 5: Platform Updates -->
    <h2 style="color:#C6923A;font-size:18px;margin:0 0 12px;font-weight:800;">🚀 What's New</h2>
    <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
        • Public leaderboards are live<br>
        • Corridor risk widgets on every load page<br>
        • Viewed-you notifications now active
    </p>
    `;
}
