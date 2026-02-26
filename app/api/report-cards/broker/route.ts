export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('id');

    if (!brokerId) {
        return new Response('Missing broker id', { status: 400 });
    }

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
        .from('v_broker_report_card')
        .select('*')
        .eq('broker_id', brokerId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') { // not found
            // Return empty report card if no data
            return Response.json({
                broker_id: brokerId,
                display_name: 'Unknown Broker',
                trust_score: 50,
                jobs_posted: 0,
                avg_payment_days: null,
                fill_rate_pct: 0,
                rank_tier: 'New',
                improvement_tips: [],
            });
        }
        return new Response(error.message, { status: 500 });
    }

    return Response.json(data);
}
