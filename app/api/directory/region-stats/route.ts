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

    // Use the materialized view RPC instead of scanning every row (audit 2026-03-28)
    // Falls back to direct MV query if RPC doesn't exist yet
    let result: { state: string; total: number; claimed: number; unclaimed: number; avg_rating: number | null }[] = [];

    const { data: rpcData, error: rpcError } = await supabase.rpc('rpc_state_counts');

    if (!rpcError && rpcData) {
      result = (rpcData as any[]).map(row => ({
        state: row.state,
        total: row.total,
        claimed: row.claimed_count,
        unclaimed: row.unclaimed_count,
        avg_rating: row.avg_rating ? Number(row.avg_rating) : null,
      }));
    } else {
      // Fallback: try direct MV read
      const { data: mvData, error: mvError } = await supabase
        .from('mv_state_counts')
        .select('*')
        .order('total', { ascending: false });

      if (!mvError && mvData) {
        result = (mvData as any[]).map(row => ({
          state: row.state,
          total: row.total,
          claimed: row.claimed_count,
          unclaimed: row.unclaimed_count,
          avg_rating: row.avg_rating ? Number(row.avg_rating) : null,
        }));
      } else {
        // Last resort: lightweight count query (NOT full scan)
        const { data, error } = await supabase
          .from('listings')
          .select('state', { count: 'exact' })
          .eq('active', true)
          .not('state', 'is', null);

        if (error) throw error;

        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          const s = (row.state ?? '').toUpperCase().trim();
          if (s) counts[s] = (counts[s] || 0) + 1;
        }
        result = Object.entries(counts)
          .map(([state, total]) => ({ state, total, claimed: 0, unclaimed: total, avg_rating: null }))
          .sort((a, b) => b.total - a.total);
      }
    }

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
