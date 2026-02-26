import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { createHmac } from 'https://deno.land/std@0.177.0/crypto/mod.ts'

/**
 * ad-impression-confirm — Edge Function
 * 
 * Called by NativeAdCard when ad is rendered + dwelled.
 * Verifies token, checks dwell threshold, marks impression billable.
 */

serve(async (req: Request) => {
    try {
        if (req.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        const { impression_token, dwell_ms, session_id } = await req.json();

        if (!impression_token) {
            return new Response(JSON.stringify({ error: 'missing_token' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { data, error } = await supabase.rpc('confirm_impression', {
            p_impression_token: impression_token,
            p_dwell_ms: dwell_ms || 0,
            p_session_id: session_id || null,
        });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Impression confirm error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
})
