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

        const { origin, destination } = await req.json().catch(() => ({})) as { origin?: string; destination?: string };

        // Logic: Calculate distance
        // Placeholder

        return new Response(JSON.stringify({
            miles: 42,
            minutes: 55
        }), { headers: { ...corsHeaders, "content-type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" }
        });
    }
});
