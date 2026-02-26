export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || '';

    if (!state) return new Response('Missing state', { status: 400 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
        .from('v_market_liquidity')
        .select('*')
        .eq('geo_key', state.toUpperCase())
        .maybeSingle();

    if (error) return new Response(error.message, { status: 500 });

    // If no data for this geo, return a "cold market" default
    if (!data) {
        return Response.json({
            geo_key: state.toUpperCase(),
            liquidity_score: 0,
            predicted_fill_minutes: 180,
            risk_band: 'red',
            active_drivers: 0,
            active_loads: 0,
            matches_6h: 0,
            updated_at: new Date().toISOString(),
        });
    }

    return Response.json(data);
}
