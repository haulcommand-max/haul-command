/// <reference types="npm:@supabase/functions-js/edge-runtime.d.ts" />
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_STATUSES = ["available", "busy", "resting", "do_not_disturb"] as const;
type AvailStatus = typeof VALID_STATUSES[number];

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const body = await req.json().catch(() => ({}));
    const requestedStatus = body?.status as AvailStatus | undefined;
    const windowHours: number = Number(body?.window_hours ?? 2);

    if (!requestedStatus || !VALID_STATUSES.includes(requestedStatus)) {
        return new Response(JSON.stringify({ error: "Invalid status. Must be one of: " + VALID_STATUSES.join(", ") }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const now = new Date();
    const escort_id = user.id;

    // 1. Update escort_presence status
    const { error: presenceErr } = await supabase
        .from("escort_presence")
        .upsert({ escort_id, status: requestedStatus, last_heartbeat_at: now.toISOString(), updated_at: now.toISOString() },
            { onConflict: "escort_id" });

    if (presenceErr) return new Response(JSON.stringify({ error: presenceErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    // 2. If setting to available: upsert an instant availability window for next N hours
    if (requestedStatus === "available") {
        const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

        // Check for existing instant window that's still active and extend it
        const { data: existing } = await supabase
            .from("escort_availability_windows")
            .select("id")
            .eq("escort_id", escort_id)
            .eq("mode", "instant")
            .gte("end_at", now.toISOString())
            .order("end_at", { ascending: false })
            .limit(1)
            .single();

        if (existing?.id) {
            // Extend existing instant window
            await supabase
                .from("escort_availability_windows")
                .update({ end_at: windowEnd.toISOString(), updated_at: now.toISOString() })
                .eq("id", existing.id);
        } else {
            // Create new instant window
            await supabase.from("escort_availability_windows").insert({
                escort_id,
                mode: "instant",
                start_at: now.toISOString(),
                end_at: windowEnd.toISOString(),
            });
        }
    }

    return new Response(JSON.stringify({
        ok: true,
        status: requestedStatus,
        window_hours: requestedStatus === "available" ? windowHours : null,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
