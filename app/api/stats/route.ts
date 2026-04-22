import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/stats — public stats for social proof
export async function GET() {
  try {
    const supabase = createClient();

    const [operatorCount, loadCount] = await Promise.all([
      supabase
        .from('hc_global_operators')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('loads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
    ]);

    return NextResponse.json({
      operators: operatorCount.count || 7745,
      countries: 57,
      corridors: 219,
      loads_completed: loadCount.count || 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json({
      operators: 7745,
      countries: 57,
      corridors: 219,
      loads_completed: 0,
    });
  }
}
