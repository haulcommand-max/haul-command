'use client';

import { useEffect, useState } from 'react';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Operator {
  id: string;
  business_name: string | null;
  display_name: string | null;
  slug: string;
  country_code: string;
  region_code: string | null;
  city: string | null;
  trust_score: number | null;
  is_verified: boolean;
  available_since: string;
  available_until: string | null;
  corridor_slugs: string[] | null;
  rate_per_km: number | null;
  currency: string | null;
  vehicle_type: string | null;
  reposition_only: boolean;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function AvailableNowPage() {
  const supabase = createClientComponentClient();
  const [ops, setOps] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  useEffect(() => {
    load();
    // Real-time subscription
    const ch = supabase
      .channel('available_now')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hc_available_now',
      }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function load() {
    const { data } = await supabase
      .from('hc_available_now')
      .select('id,business_name,display_name,slug,country_code,region_code,city,trust_score,is_verified,available_since,available_until,corridor_slugs,rate_per_km,currency,vehicle_type,reposition_only')
      .gte('available_until', new Date().toISOString())
      .order('trust_score', { ascending: false })
      .limit(60);
    setOps((data ?? []) as Operator[]);
    setLoading(false);
  }

  const filtered = ops.filter(o => {
    const q = filter.toLowerCase();
    const matchQ = !q || (o.business_name ?? '').toLowerCase().includes(q)
      || (o.city ?? '').toLowerCase().includes(q)
      || (o.region_code ?? '').toLowerCase().includes(q);
    const matchC = !countryFilter || o.country_code === countryFilter.toUpperCase();
    return matchQ && matchC;
  });

  const countries = [...new Set(ops.map(o => o.country_code))].sort();

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-[#0f1420] to-[#0a0d14] px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">Live feed</span>
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Available Now
            <span className="ml-3 text-2xl font-normal text-white/40">— {ops.length} operators</span>
          </h1>
          <p className="mt-2 text-white/50">Verified escort operators broadcasting availability right now across {countries.length} countries.</p>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap gap-3">
            <input
              type="search"
              placeholder="Search by name, city, region…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 focus:border-amber-500/50 focus:outline-none"
            />
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
            >
              <option value="">All countries</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/4 p-10 text-center">
            <div className="text-4xl">📡</div>
            <p className="mt-3 font-semibold text-white">No operators available right now</p>
            <p className="mt-1 text-sm text-white/40">Operators broadcast availability in real time. Check back soon or post a load to get notified.</p>
            <Link href="/route-check" className="mt-5 inline-flex rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors">
              Post a route request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(op => <OperatorCard key={op.id} op={op} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function OperatorCard({ op }: { op: Operator }) {
  const trustColor = op.trust_score != null
    ? op.trust_score >= 80 ? 'text-green-400' : op.trust_score >= 60 ? 'text-amber-400' : 'text-white/40'
    : 'text-white/30';

  return (
    <Link
      href={`/directory/${op.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-4 hover:border-white/20 hover:bg-white/8 transition-all"
    >
      {/* Live dot */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-lg">
          {op.vehicle_type === 'pilot_car' ? '🚕' : op.vehicle_type === 'escort_truck' ? '🚚' : '🚛'}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white group-hover:text-amber-300 transition-colors">
            {op.business_name ?? op.display_name ?? 'Operator'}
          </p>
          {op.is_verified && (
            <span className="shrink-0 rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">✓ Verified</span>
          )}
          {op.reposition_only && (
            <span className="shrink-0 rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-300">Reposition</span>
          )}
        </div>
        <p className="truncate text-xs text-white/40">
          {[op.city, op.region_code, op.country_code].filter(Boolean).join(', ')}
          {op.rate_per_km ? ` · ${op.currency ?? 'USD'} ${op.rate_per_km}/km` : ''}
        </p>
      </div>

      {/* Trust score */}
      <div className="shrink-0 text-right">
        <p className={`text-lg font-black leading-none ${trustColor}`}>
          {op.trust_score != null ? op.trust_score : '—'}
        </p>
        <p className="text-[10px] text-white/30">trust</p>
      </div>

      {/* Since */}
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-xs text-white/30">{timeAgo(op.available_since)}</p>
        {op.available_until && (
          <p className="text-[10px] text-white/20">
            until {new Date(op.available_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </Link>
  );
}
