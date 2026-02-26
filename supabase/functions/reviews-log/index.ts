import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Req = { user_id?: string; platform: "ios" | "android" | "web"; event_type: "prompted" | "accepted" | "dismissed"; context?: string };

serve(async (req) => {
    try {
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        const body = (await req.json()) as Req;
        const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

        const { error } = await sb.from("review_events").insert({
            user_id: body.user_id ?? null,
            platform: body.platform,
            event_type: body.event_type,
            context: body.context ?? null
        });

        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
});
