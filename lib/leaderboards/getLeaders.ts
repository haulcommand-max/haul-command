import { createServerClient } from '@/lib/supabase/server';

export type LeaderboardScope = 'national' | 'state' | 'corridor';

export interface Leader {
  id: string;
  company: string;
  rank: string;
  runs: number;
  rating: number;
  response: string;
  loc: string;
  score: number;
  fmcsa_status?: string;
  active_corridors?: string[];
  hc_rank_national?: number;
}

function mapTier(tier: string | null): string {
  const map: Record<string, string> = {
    vanguard: 'Vanguard', centurion: 'Centurion',
    sentinel: 'Sentinel', operator: 'Operator',
  };
  return map[tier?.toLowerCase() ?? ''] ?? 'Operator';
}

function formatResponse(mins: number | null): string {
  if (!mins) return 'N/A';
  return mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`;
}

function formatLoc(city: string | null, state: string | null, country: string | null): string {
  if (city && state) return `${city}, ${state}`;
  if (city && country) return `${city}, ${country}`;
  return state ?? country ?? 'Location unknown';
}

export async function getLeaders(
  scope: LeaderboardScope = 'national',
  filter?: string,
  limit = 25,
): Promise<Leader[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('operators')
    .select('id,company_name,hc_tier,hc_index_score,verified_runs,rating_avg,avg_response_min,location_city,location_state,location_country,active_corridors,fmcsa_status,hc_rank_national')
    .not('hc_index_score', 'is', null)
    .gt('hc_index_score', 0)
    .order('hc_index_score', { ascending: false })
    .limit(limit);

  if (scope === 'state' && filter) query = query.eq('location_state', filter.toUpperCase());
  if (scope === 'corridor' && filter) query = query.contains('active_corridors', [filter]);

  const { data, error } = await query;
  if (error) { console.error('[getLeaders] DB error:', error.message); return []; }

  return (data ?? []).map((row, i) => ({
    id: row.id,
    company: row.company_name ?? 'Unknown Operator',
    rank: mapTier(row.hc_tier),
    runs: row.verified_runs ?? 0,
    rating: typeof row.rating_avg === 'number' ? row.rating_avg : 0,
    response: formatResponse(row.avg_response_min),
    loc: formatLoc(row.location_city, row.location_state, row.location_country),
    score: typeof row.hc_index_score === 'number' ? Math.round(row.hc_index_score * 10) / 10 : 0,
    fmcsa_status: row.fmcsa_status ?? 'unverified',
    active_corridors: row.active_corridors ?? [],
    hc_rank_national: row.hc_rank_national ?? (i + 1),
  }));
}

export async function getTopLeaders(n = 5): Promise<Leader[]> {
  return getLeaders('national', undefined, n);
}
