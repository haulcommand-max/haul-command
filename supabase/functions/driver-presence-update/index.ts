import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Json = Record<string, unknown>;

interface PresencePayload {
    user_id: string;
    lat: number;
    lng: number;
    city: string;
    state: string;
    is_available: boolean;
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const body = await req.json().catch(() => ({})) as Partial<PresencePayload>;
        const { user_id, lat, lng, city, state, is_available } = body;

        if (!user_id) throw new Error("user_id is required");

        const { error } = await supabase.from('driver_presence').upsert({
            user_id,
            lat,
            lng,
            current_city: city,
            current_state: state,
            is_available,
            last_seen_at: new Date().toISOString()
        });

        if (error) throw error;

        return new Response(JSON.stringify({ status: "updated" }), { headers: { ...corsHeaders, "content-type": "application/json" } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "content-type": "application/json" }
        });
    }
});
