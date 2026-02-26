import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Req = {
    platform: "ios" | "android" | "web";
    source?: string;
    campaign?: string;
    referrer_code?: string;
    device_hash?: string;
};

serve(async (req) => {
    try {
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        const body = (await req.json()) as Req;

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, serviceKey);

        const { data, error } = await sb
            .from("app_installs")
            .insert({
                platform: body.platform,
                source: body.source ?? null,
                campaign: body.campaign ?? null,
                referrer_code: body.referrer_code ?? null,
                device_hash: body.device_hash ?? null,
            })
            .select("id")
            .single();

        if (error) throw error;

        // Credit referral install points (optional)
        if (body.referrer_code) {
            await sb.from("referral_events").insert({
                referral_code: body.referrer_code,
                install_id: data.id,
                event_type: "install",
                points: 10
            });
        }

        return new Response(JSON.stringify({ ok: true, install_id: data.id }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
});
