import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Json = Record<string, unknown>;

serve(async (req: Request) => {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { offer_id } = await req.json().catch(() => ({ offer_id: null })) as { offer_id?: string };
    if (!offer_id) return new Response(JSON.stringify({ error: "Missing offer_id" }), { status: 400 });

    // Use the atomic RPC
    const { data, error } = await admin.rpc("rpc_create_job_from_offer", { p_offer_id: offer_id });

    if (error) {
        // Basic error mapping
        return new Response(JSON.stringify({ error: error.message }), { status: 409 });
    }

    return new Response(JSON.stringify({ job_id: data }), {
        headers: { "Content-Type": "application/json" },
    });
});
