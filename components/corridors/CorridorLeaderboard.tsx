'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';

interface CorridorRow {
  slug: string;
  name: string;
  short_name: string;
  country_code: string;
  corridor_type: string;
  tier: string;
  composite_score: number | null;
  search_volume_estimate: number | null;
  commercial_value_estimate: number | null;
  is_cross_border: boolean;
  distance_km: number | null;
  currency_code: string;
  origin_city_name: string | null;
  destination_city_name: string | null;
}

interface Props {
  limit?: number;
  countryCode?: string;
  corridorType?: string;
  showSponsorSlot?: boolean;
  className?: string;
}

const TYPE_LABELS: Record<string, string> = {
  country_spine: 'National Spine',
  port_connector: 'Port Connector',
  industrial_connector: 'Industrial',
  border_connector: 'Cross-Border',
  metro_connector: 'Metro',
  regional_connector: 'Regional',
};

const TIER_COLORS: Record<string, string> = {
  flagship: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  national: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  regional: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export function CorridorLeaderboard({
  limit = 20,
  countryCode,
  corridorType,
  showSponsorSlot = true,
  className = '',
}: Props) {
  const supabase = createClientComponentClient();
  const [corridors, setCorridors] = useState<CorridorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let q = supabase
        .from('hc_corridor_public_v1')
        .select(
          'slug,name,short_name,country_code,corridor_type,tier,composite_score,search_volume_estimate,commercial_value_estimate,is_cross_border,distance_km,currency_code,origin_city_name,destination_city_name'
        )
        .eq('status', 'active')
        .order('composite_score', { ascending: false })
        .limit(limit);

      if (countryCode) q = q.eq('country_code', countryCode.toUpperCase());
      if (corridorType) q = q.eq('corridor_type', corridorType);

      const { data, error: err } = await q;
      if (err) { setError(err.message); }
      else { setCorridors((data ?? []) as CorridorRow[]); }
      setLoading(false);
    }
    load();
  }, [limit, countryCode, corridorType]);

  if (loading) return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
      Could not load corridor rankings. <span className="opacity-60">{error}</span>
    </div>
  );

  if (!corridors.length) return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
      No corridors found for this filter.
    </div>
  );

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Sponsor slot — top of leaderboard */}
      {showSponsorSlot && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <span className="shrink-0 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
            Sponsored
          </span>
          <span className="text-sm text-white/60">Your corridor coverage ad here —</span>
          <Link
            href="/advertise?surface=corridor-leaderboard"
            className="ml-auto shrink-0 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            Get this spot
          </Link>
        </div>
      )}

      {corridors.map((c, idx) => (
        <Link
          key={c.slug}
          href={`/corridors/${c.slug}`}
          className="group flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3 hover:border-white/20 hover:bg-white/8 transition-all"
        >
          {/* Rank */}
          <span className="w-7 shrink-0 text-center text-sm font-bold text-white/30 group-hover:text-white/60 transition-colors">
            {idx + 1}
          </span>

          {/* Flag */}
          <span className="shrink-0 text-xl" title={c.country_code}>
            {countryCodeToEmoji(c.country_code)}
          </span>

          {/* Name + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              {c.short_name || c.name}
            </p>
            <p className="truncate text-xs text-white/40">
              {c.origin_city_name && c.destination_city_name
                ? `${c.origin_city_name} → ${c.destination_city_name}`
                : c.name}
              {c.distance_km ? ` · ${c.distance_km.toLocaleString()} km` : ''}
              {c.is_cross_border ? ' · ✈ Cross-Border' : ''}
            </p>
          </div>

          {/* Type badge */}
          <span className="hidden shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium sm:inline-flex
            bg-white/5 border-white/10 text-white/50">
            {TYPE_LABELS[c.corridor_type] ?? c.corridor_type}
          </span>

          {/* Tier badge */}
          <span className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold capitalize sm:inline-flex ${TIER_COLORS[c.tier] ?? 'bg-white/5 border-white/10 text-white/40'}`}>
            {c.tier}
          </span>

          {/* Score */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-white">
              {c.composite_score != null ? Math.round(c.composite_score) : '—'}
            </p>
            <p className="text-xs text-white/30">score</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// Locale-safe emoji flag
function countryCodeToEmoji(code: string): string {
  try {
    return code
      .toUpperCase()
      .split('')
      .map(c => String.fromCodePoint(c.charCodeAt(0) + 127397))
      .join('');
  } catch {
    return '🌐';
  }
}

export default CorridorLeaderboard;
