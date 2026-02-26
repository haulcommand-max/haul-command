import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Req = {
    market_id: string;
    base_quote: number; // dollars
    context?: {
        pickup_window_hours?: number;
        escorts_required?: number;
        broker_score?: "elite" | "standard" | "risky";
        corridor_priority?: number;
    };
};

function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
}

serve(async (req) => {
    try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

        const body = (await req.json()) as Req;
        if (!body.market_id || !Number.isFinite(body.base_quote)) {
            return new Response(JSON.stringify({ error: "market_id and base_quote required" }), { status: 400 });
        }

        // 1) Load market stats
        const { data: ms, error: msErr } = await sb
            .from("pricing_market_stats")
            .select("*")
            .eq("market_id", body.market_id)
            .maybeSingle();

        if (msErr) throw msErr;
        if (!ms) {
            return new Response(JSON.stringify({ error: "market not found" }), { status: 404 });
        }

        // 2) Compute DSM_base (guardrails first)
        // BaseSurge from CSI (matches your table from earlier)
        const csi = Number(ms.csi ?? 1.0);
        let baseSurge = 1.0;
        if (csi > 1.3) baseSurge = 0.95;
        else if (csi >= 0.9) baseSurge = 1.0;
        else if (csi >= 0.6) baseSurge = 1.15;
        else if (csi >= 0.4) baseSurge = 1.35;
        else baseSurge = 1.6;

        const scarcity = clamp(Number(ms.scarcity_pressure ?? 0), 0.0, 1.8);
        const urgency = clamp(Number(ms.urgency_pressure ?? 0), 0.0, 1.6);
        const corridorPriority = clamp(Number(body.context?.corridor_priority ?? ms.corridor_priority ?? 1.0), 0.8, 1.25);

        const brokerScore = body.context?.broker_score ?? "standard";
        const brokerMod = brokerScore === "elite" ? 0.95 : brokerScore === "risky" ? 1.10 : 1.00;

        const dsmBase = clamp(baseSurge * (1 + scarcity * 0.35) * (1 + urgency * 0.25) * corridorPriority * brokerMod, 0.90, 2.75);

        // 3) Choose arm (delta) using simple Thompson Sampling on Beta(alpha,beta)
        const { data: arms, error: armErr } = await sb
            .from("pricing_bandit_arms")
            .select("*")
            .eq("market_id", body.market_id);

        if (armErr) throw armErr;

        // If arms not initialized, create default arms
        const defaultDeltas = [-0.10, -0.05, 0.0, 0.05, 0.10, 0.15, 0.20];
        if (!arms || arms.length === 0) {
            const inserts = defaultDeltas.map((d) => ({ market_id: body.market_id, arm_delta: d }));
            const { error: insErr } = await sb.from("pricing_bandit_arms").insert(inserts);
            if (insErr) throw insErr;
        }

        // re-fetch arms
        const { data: arms2, error: armErr2 } = await sb
            .from("pricing_bandit_arms")
            .select("*")
            .eq("market_id", body.market_id);

        if (armErr2) throw armErr2;

        // Sample from Beta(alpha,beta): use gamma sampling approximation
        function randGamma(shape: number): number {
            // Marsaglia and Tsang method (shape >= 1); for <1 use boost
            if (shape < 1) return randGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
            const d = shape - 1 / 3;
            const c = 1 / Math.sqrt(9 * d);
            while (true) {
                let x = 0;
                let v = 0;
                do {
                    const u1 = Math.random();
                    const u2 = Math.random();
                    x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // normal
                    v = 1 + c * x;
                } while (v <= 0);
                v = v * v * v;
                const u = Math.random();
                if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
                if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
            }
        }

        function sampleBeta(alpha: number, beta: number) {
            const x = randGamma(alpha);
            const y = randGamma(beta);
            return x / (x + y);
        }

        let best = arms2![0];
        let bestSample = -1;

        for (const a of arms2!) {
            const alpha = Number(a.alpha ?? 1);
            const beta = Number(a.beta ?? 1);
            const s = sampleBeta(alpha, beta);
            if (s > bestSample) {
                bestSample = s;
                best = a;
            }
        }

        // 4) Apply delta within tight bounds (shock protection)
        const delta = clamp(Number(best.arm_delta ?? 0), -0.15, 0.25);
        const dsm = clamp(dsmBase + delta, 0.90, 2.75);

        // 5) Update market current snapshot (optional)
        await sb.from("pricing_market_stats").update({
            dsm_base: dsmBase,
            dsm_current: dsm,
            last_delta: delta,
        }).eq("market_id", body.market_id);

        const finalPrice = Math.round(body.base_quote * dsm * 100) / 100;

        return new Response(JSON.stringify({
            market_id: body.market_id,
            base_quote: body.base_quote,
            dsm_base: dsmBase,
            delta_chosen: delta,
            dsm_final: dsm,
            final_price: finalPrice,
            arm_id: best.id,
        }), { headers: { "content-type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
    }
});
