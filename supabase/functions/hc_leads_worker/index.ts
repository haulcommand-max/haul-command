import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function env(name: string): string { const v = Deno.env.get(name); if (!v) throw new Error(`Missing env ${name}`); return v; }
function json(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }

/**
 * Leads Worker — Routes inbound leads to best-matching operators.
 *
 * Flow:
 *  1. Picks up leads with status='new'
 *  2. Finds best operators by quality score
 *  3. Routes lead to top operator with 24h expiry
 *  4. Expires old unaccepted leads
 */
Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
        const url = env("SUPABASE_URL");
        const key = env("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        const body = await req.json().catch(() => ({}));
        const batchSize = body.batch_size || 50;

        // 1. Get new leads
        const { data: leads, error: lErr } = await supabase.from("leads")
            .select("*").eq("status", "new").order("created_at", { ascending: true }).limit(batchSize);
        if (lErr) return json(500, { ok: false, error: lErr.message });
        if (!leads || leads.length === 0) return json(200, { ok: true, routed: 0 });

        let routed = 0;
        const results: Record<string, unknown>[] = [];

        for (const lead of leads) {
            // 2. Find best operator in same country
            const { data: candidates } = await supabase.from("operator_quality")
                .select("operator_id,final_score")
                .eq("country_code", lead.country_code)
                .gte("final_score", 20)
                .order("final_score", { ascending: false })
                .limit(5);

            if (!candidates || candidates.length === 0) {
                results.push({ lead_id: lead.id, status: "no_candidates" });
                continue;
            }

            const bestOp = candidates[0];
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            // 3. Route lead
            const { error: rErr } = await supabase.from("leads").update({
                status: "routed", routed_to_operator_id: bestOp.operator_id,
                routed_at: new Date().toISOString(), expires_at: expiresAt,
            }).eq("id", lead.id).eq("status", "new");

            if (!rErr) {
                routed++;
                results.push({ lead_id: lead.id, status: "routed", operator_id: bestOp.operator_id, score: bestOp.final_score });
            }
        }

        // 4. Expire old routed leads
        const { data: expiredLeads } = await supabase.from("leads")
            .select("id").eq("status", "routed").lt("expires_at", new Date().toISOString());
        let expired_resets = 0;
        if (expiredLeads) {
            for (const el of expiredLeads) {
                await supabase.from("leads").update({ status: "expired", routed_to_operator_id: null }).eq("id", el.id);
                expired_resets++;
            }
        }

        return json(200, { ok: true, leads_processed: leads.length, routed, expired_resets, results: results.slice(0, 10) });
    } catch (e) { return json(500, { ok: false, error: (e as Error).message }); }
});
