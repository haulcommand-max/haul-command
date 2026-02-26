import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Json = Record<string, unknown>;

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();
    const body: Json = await req.json().catch(() => ({}));
    const brokerId = String(body.brokerId ?? "");

    if (!brokerId) {
        return new Response(JSON.stringify({ ok: false, error: "brokerId required" }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
            status: 400
        });
    }

    // MVP inputs (replace with real aggregates later)
    const paymentSpeedDays = Number(body.paymentSpeedDays ?? 35);
    const cancellationRate = Number(body.cancellationRate ?? 0.08);
    const disputeRate = Number(body.disputeRate ?? 0.02);
    const ghostLoadRate = Number(body.ghostLoadRate ?? 0.04);

    // Defensible score (0..100): lower bad rates + faster pay => higher score
    const payComponent = clamp(100 - (paymentSpeedDays - 10) * 2, 0, 100);      // pay fast wins
    const cancelComponent = clamp(100 - cancellationRate * 300, 0, 100);
    const disputeComponent = clamp(100 - disputeRate * 700, 0, 100);
    const ghostComponent = clamp(100 - ghostLoadRate * 500, 0, 100);

    const score = clamp(
        payComponent * 0.45 + cancelComponent * 0.25 + disputeComponent * 0.20 + ghostComponent * 0.10,
        0,
        100
    );

    const breakdown = {
        payComponent, cancelComponent, disputeComponent, ghostComponent,
        weights: { pay: 0.45, cancel: 0.25, dispute: 0.20, ghost: 0.10 }
    };

    const { error } = await supabase.from("broker_trust_scores").upsert({
        broker_id: brokerId,
        score,
        payment_speed_days: paymentSpeedDays,
        cancellation_rate: cancellationRate,
        dispute_rate: disputeRate,
        ghost_load_rate: ghostLoadRate,
        last_recomputed_at: new Date().toISOString(),
        breakdown
    });

    if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
            headers: { ...corsHeaders, "content-type": "application/json" },
            status: 500
        });
    }

    return new Response(JSON.stringify({ ok: true, brokerId, score, breakdown }), {
        headers: { ...corsHeaders, "content-type": "application/json" }
    });
});
