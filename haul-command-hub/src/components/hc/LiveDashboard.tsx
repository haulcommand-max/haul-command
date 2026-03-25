'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface RunNearby { id: string; load_type: string; origin: string; destination: string; posted_at: string; }
interface Corridor { id: string; name: string; corridor_type: string; }
interface PilotNearby { id: string; name: string; city: string; state: string; }
interface RankData { rank: number; total: number; score: number; }

export default function LiveDashboard() {
  const supabase = createClient();

  const [runs, setRuns] = useState<RunNearby[] | null>(null);
  const [corridors, setCorridors] = useState<Corridor[] | null>(null);
  const [pilots, setPilots] = useState<PilotNearby[] | null>(null);
  const [rank, setRank] = useState<RankData | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch all 4 in parallel — one failure doesn't block others
    const fetchAll = async () => {
      const [runsResult, corridorsResult, pilotsResult, rankResult] = await Promise.allSettled([
        supabase.from('hc_places').select('id, surface_category_key, city, country_code, name')
          .eq('status', 'published').order('created_at', { ascending: false }).limit(5),
        supabase.from('corridors').select('id, name, corridor_type')
          .limit(5),
        supabase.from('hc_places').select('id, name, city, state_province')
          .eq('surface_category_key', 'escort_staging')
          .eq('status', 'published')
          .limit(5),
        // Rank is a future feature — gracefully return null
        Promise.resolve({ data: null, error: null }),
      ]);

      // Runs
      if (runsResult.status === 'fulfilled' && !(runsResult.value as any).error) {
        const data = (runsResult.value as any).data ?? [];
        setRuns(data.map((r: any) => ({
          id: r.id,
          load_type: r.surface_category_key ?? 'general',
          origin: r.city ?? r.name ?? 'Unknown',
          destination: r.country_code?.toUpperCase() ?? '',
          posted_at: '',
        })));
      } else {
        setRuns([]);
        setErrors(e => ({ ...e, runs: 'Could not load nearby listings' }));
      }

      // Corridors
      if (corridorsResult.status === 'fulfilled' && !(corridorsResult.value as any).error) {
        setCorridors((corridorsResult.value as any).data ?? []);
      } else {
        setCorridors([]);
        setErrors(e => ({ ...e, corridors: 'Could not load corridors' }));
      }

      // Pilots
      if (pilotsResult.status === 'fulfilled' && !(pilotsResult.value as any).error) {
        const data = (pilotsResult.value as any).data ?? [];
        setPilots(data.map((p: any) => ({
          id: p.id,
          name: p.name,
          city: p.city ?? '',
          state: p.state_province ?? '',
        })));
      } else {
        setPilots([]);
        setErrors(e => ({ ...e, pilots: 'Could not load pilots' }));
      }

      // Rank
      if (rankResult.status === 'fulfilled') {
        const data = (rankResult.value as any)?.data;
        setRank(data ?? null);
      } else {
        setRank(null);
      }

      setLoaded(true);
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Live For You</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DashCard title="Nearby Listings" icon="📦" error={errors.runs}>
          {runs === null ? <Spinner /> : runs.length === 0 ? (
            <p className="text-xs text-white/40">No listings nearby yet.</p>
          ) : runs.map(r => (
            <p key={r.id} className="text-xs text-white/70 truncate">{r.origin} · {r.destination}</p>
          ))}
        </DashCard>

        <DashCard title="Active Corridors" icon="🗺️" error={errors.corridors}>
          {corridors === null ? <Spinner /> : corridors.length === 0 ? (
            <p className="text-xs text-white/40">Follow corridors to see them here.</p>
          ) : corridors.map(c => (
            <p key={c.id} className="text-xs text-white/70 truncate">{c.name}</p>
          ))}
        </DashCard>

        <DashCard title="Escort Staging" icon="🚗" error={errors.pilots}>
          {pilots === null ? <Spinner /> : pilots.length === 0 ? (
            <p className="text-xs text-white/40">No staging areas found nearby.</p>
          ) : pilots.map(p => (
            <p key={p.id} className="text-xs text-white/70 truncate">{p.name} — {p.city}{p.state ? `, ${p.state}` : ''}</p>
          ))}
        </DashCard>

        <DashCard title="Your Rank" icon="📈" error={errors.rank}>
          {!loaded ? <Spinner /> : rank === null ? (
            <p className="text-xs text-white/40">Claim your profile to get ranked.</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-amber-400">#{rank.rank}</p>
              <p className="text-xs text-white/50">of {rank.total} operators</p>
            </>
          )}
        </DashCard>
      </div>
    </section>
  );
}

function DashCard({ title, icon, error, children }: {
  title: string; icon: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 min-h-[100px]">
      <div className="flex items-center gap-1.5 mb-2">
        <span>{icon}</span>
        <span className="text-xs font-semibold text-white/80">{title}</span>
      </div>
      <div className="border-b border-amber-500 w-8 mb-2" />
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : children}
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />;
}
