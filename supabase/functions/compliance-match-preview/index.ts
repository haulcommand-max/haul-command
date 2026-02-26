import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Json = Record<string, unknown>;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { job_id, driver_id } = await req.json().catch(() => ({})) as { job_id?: string; driver_id?: string };

        // Logic: Check driver certs vs job_requirements
        // Placeholder logic
        const eligible = true;
        const missing_certs: string[] = [];

        return new Response(JSON.stringify({
            eligible,
            missing_certs
        }), { headers: { ...corsHeaders, "content-type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" }
        });
    }
});
