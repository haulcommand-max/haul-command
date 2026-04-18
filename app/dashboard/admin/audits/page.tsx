import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Profile Audit Dashboard | Haul Command Admin',
  description: 'Monitor profile audit runs, hard failures, repair queues, and surface suppression across all markets.',
  robots: { index: false, follow: false },
};

// Re-used type
interface AuditRow {
  entity_id: string;
  hc_id?: string;
  profile_class?: string;
  audit_status?: string;
  score_total?: number;
  hard_fail?: boolean;
  fail_reason_codes?: string[];
  score_geo_truth?: number;
  score_local_intent_packaging?: number;
  score_proof_conversion?: number;
  score_render_visibility?: number;
  score_link_graph?: number;
  score_freshness?: number;
  country_code?: string;
  city_name?: string;
  region_code?: string;
  repair_count?: number;
  suppress_near_me?: boolean;
  suppress_city_featured?: boolean;
  completed_at?: string;
}

const SCORE_COLOR = (v?: number) => {
  if (!v) return 'text-gray-600';
  if (v >= 85) return 'text-green-400';
  if (v >= 70) return 'text-amber-400';
  return 'text-red-400';
};

const SCORE_BAR = (v?: number) => {
  const w = v ? Math.round(v) : 0;
  const color = w >= 85 ? '#22c55e' : w >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: color }} />
    </div>
  );
};

export default async function AdminAuditsPage({
  searchParams,
}: {
  searchParams: { filter?: string; country?: string; page?: string };
}) {
  const supabase = await createClient();
  const filter = searchParams.filter ?? 'all';
  const country = searchParams.country;
  const page = parseInt(searchParams.page ?? '1', 10);
  const PAGE_SIZE = 25;

  let query = supabase
    .from('v_audit_dashboard')
    .select('*', { count: 'exact' });

  if (filter === 'hard_fail') query = query.eq('hard_fail', true);
  if (filter === 'suppressed') query = query.eq('suppress_near_me', true);
  if (filter === 'low_score') query = query.lt('score_total', 60);
  if (country) query = query.eq('country_code', country.toUpperCase());

  const { data: rows, count, error } = await query
    .order('hard_fail', { ascending: false })
    .order('score_total', { ascending: true, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Summary stats
  const { data: stats } = await supabase
    .from('profile_audit_runs')
    .select('hard_fail, score_total, suppress_near_me, country_code')
    .order('completed_at', { ascending: false })
    .limit(1000);

  const totalProfiles = stats?.length ?? 0;
  const hardFails = stats?.filter((s) => s.hard_fail).length ?? 0;
  const suppressed = stats?.filter((s) => s.suppress_near_me).length ?? 0;
  const avgScore = stats?.length
    ? Math.round(stats.reduce((a, s) => a + (s.score_total ?? 0), 0) / stats.length)
    : 0;

  const filterOptions = [
    { key: 'all', label: 'All Profiles' },
    { key: 'hard_fail', label: `Hard Fails (${hardFails})` },
    { key: 'suppressed', label: `Suppressed (${suppressed})` },
    { key: 'low_score', label: 'Score < 60' },
  ];

  return (
    <main className=" bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Profile Audit Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Latest audit per entity — worst first</p>
          </div>
          <Link
            href="/dashboard/admin"
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors"
          >
            â† Admin
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Profiles Audited', value: totalProfiles.toLocaleString(), color: 'text-white' },
            { label: 'Hard Fails', value: hardFails.toLocaleString(), color: hardFails > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Suppressed', value: suppressed.toLocaleString(), color: suppressed > 0 ? 'text-orange-400' : 'text-green-400' },
            { label: 'Avg Score', value: `${avgScore}/100`, color: avgScore >= 80 ? 'text-green-400' : avgScore >= 65 ? 'text-amber-400' : 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/3 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {filterOptions.map((f) => (
            <Link
              key={f.key}
              href={`/dashboard/admin/audits?filter=${f.key}${country ? `&country=${country}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.key
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden mb-6">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            <div className="col-span-3">Entity / Location</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Geo</div>
            <div className="col-span-1 text-center">Intent</div>
            <div className="col-span-1 text-center">Proof</div>
            <div className="col-span-1 text-center">Render</div>
            <div className="col-span-1 text-center">Link</div>
            <div className="col-span-1 text-center">Fresh</div>
            <div className="col-span-2">Status</div>
          </div>

          {error && (
            <div className="p-8 text-center text-red-400">
              Error loading audit data — run <code className="text-xs">npx supabase db push</code> to apply migrations.
            </div>
          )}

          {!error && (rows ?? []).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No audit results yet. Trigger a profile audit run to see data here.
            </div>
          )}

          {(rows as AuditRow[] ?? []).map((row) => (
            <div
              key={row.entity_id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-t border-white/5 hover:bg-white/2 transition-colors ${
                row.hard_fail ? 'bg-red-950/20' : ''
              }`}
            >
              {/* Entity */}
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-2">
                  {row.hard_fail && (
                    <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                  )}
                  <p className="text-sm font-medium text-white truncate">{row.hc_id ?? row.entity_id.slice(0, 8)}</p>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {[row.city_name, row.region_code, row.country_code].filter(Boolean).join(', ')}
                </p>
              </div>

              {/* Total score */}
              <div className="col-span-1 text-center">
                <p className={`text-sm font-bold ${SCORE_COLOR(row.score_total)}`}>
                  {row.score_total ?? '—'}
                </p>
                {SCORE_BAR(row.score_total)}
              </div>

              {/* Component scores */}
              {[row.score_geo_truth, row.score_local_intent_packaging, row.score_proof_conversion, row.score_render_visibility, row.score_link_graph, row.score_freshness].map((s, i) => (
                <div key={i} className="col-span-1 text-center">
                  <p className={`text-xs font-medium ${SCORE_COLOR(s)}`}>{s ?? '—'}</p>
                </div>
              ))}

              {/* Status */}
              <div className="col-span-2 flex flex-wrap gap-1 items-center">
                {row.hard_fail && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-medium">Hard Fail</span>
                )}
                {row.suppress_near_me && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 font-medium">Suppressed</span>
                )}
                {row.repair_count && (row.repair_count as number) > 0 && (
                  <span className="text-xs text-gray-500">{row.repair_count} repairs</span>
                )}
                {!row.hard_fail && !row.suppress_near_me && row.score_total && row.score_total >= 85 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-950 text-green-400 font-medium">Pass</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{count?.toLocaleString()} total records</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/dashboard/admin/audits?filter=${filter}&page=${page - 1}`}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
                  â† Prev
                </Link>
              )}
              <span className="px-3 py-1.5 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/dashboard/admin/audits?filter=${filter}&page=${page + 1}`}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition-colors">
                  Next â†’
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}