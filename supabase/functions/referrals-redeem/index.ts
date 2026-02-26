import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Req = { install_id: string; user_id: string; referrer_code?: string };

serve(async (req) => {
    try {
        if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

        const body = (await req.json()) as Req;

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, serviceKey);

        const { error: upErr } = await sb
            .from("app_installs")
            .update({ user_id: body.user_id })
            .eq("id", body.install_id);

        if (upErr) throw upErr;

        if (body.referrer_code) {
            await sb.from("referral_events").insert({
                referral_code: body.referrer_code,
                install_id: body.install_id,
                event_type: "signup",
                points: 25
            });
        }

        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e) }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }
});
