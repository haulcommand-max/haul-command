export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/enterprise/fill/probability
 * Fill probability estimator API
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { corridor_id, escorts_required, urgency_level, time_to_start_hours, miles } = body;

        if (!corridor_id) return NextResponse.json({ error: 'corridor_id required' }, { status: 400 });

        const supabase = createClient();
        const { data, error } = await supabase.rpc('predict_fill_probability', {
            p_corridor_id: corridor_id,
            p_escorts_required: escorts_required || 1,
            p_urgency_level: urgency_level || 0,
            p_time_to_start_hours: time_to_start_hours || 48,
            p_miles: miles || 100,
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
