import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/directory/region-stats
 *
 * FIXED: Returns per-state counts from `listings` table.
 * Used by the US map and state nav on the directory page.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('listings')
      .select('state, claimed, rating')
      .eq('active', true)
      .not('state', 'is', null);

    if (error) throw error;

    // Aggregate per state
    const stats: Record<string, { count: number; claimed: number; avg_rating: number | null; ratings: number[] }> = {};

    for (const row of data ?? []) {
      const s = (row.state ?? '').toUpperCase().trim();
      if (!s) continue;
      if (!stats[s]) stats[s] = { count: 0, claimed: 0, avg_rating: null, ratings: [] };
      stats[s].count++;
      if (row.claimed) stats[s].claimed++;
      if (row.rating) stats[s].ratings.push(row.rating);
    }

    // Calculate avg_rating
    const result = Object.entries(stats).map(([state, s]) => ({
      state,
      total: s.count,
      claimed: s.claimed,
      unclaimed: s.count - s.claimed,
      avg_rating: s.ratings.length
        ? Math.round((s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length) * 10) / 10
        : null,
    })).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      states: result,
      total_us: result.reduce((a, b) => a + b.total, 0),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
