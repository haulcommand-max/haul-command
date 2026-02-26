export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || '';
    const state = searchParams.get('state') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

    if (!city || !state) return new Response('Missing city/state', { status: 400 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
        .from('loads')
        .select('id,broker_id,title,origin_text,dest_text,load_date,rate_offer,currency,police_escort_risk,created_at')
        .eq('status', 'open')
        .ilike('origin_text', `%${city}%`)
        .contains('states_crossed', [state])
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) return new Response(error.message, { status: 500 });
    return Response.json(data || []);
}
