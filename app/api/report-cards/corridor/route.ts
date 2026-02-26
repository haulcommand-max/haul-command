export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) return new Response('Missing slug', { status: 400 });

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
        .from('v_corridor_report_card')
        .select('*')
        .eq('corridor_slug', slug)
        .maybeSingle();

    if (error) return new Response(error.message, { status: 500 });
    if (!data) return Response.json({
        corridor_slug: slug, loads_7d: 0, fills_7d: 0,
        fill_rate_pct: 0, avg_fill_minutes: 0, avg_rate_est: 0,
        supply_online: 0, supply_total: 0, corridor_score: 0,
        letter_grade: 'D', computed_at: new Date().toISOString(),
    });

    return Response.json(data);
}
