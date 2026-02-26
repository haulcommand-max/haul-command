export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/corridors/stress
// Returns current corridor stress scores for the map overlay
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('corridor_stress_scores')
        .select('corridor_slug, stress_score, band, active_escort_count, load_count_24h, region_a, region_b, computed_at')
        .order('stress_score', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? [], {
        headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
    });
}
