'use client';

/**
 * OperatorLivePanel — Operator-side live command mode.
 *
 * Truth-safe features only:
 *   ✅ Profile freshness status + improvement prompts
 *   ✅ Declare availability (sets hc_available_now.available_until)
 *   ✅ Trust score progress + next upgrade path
 *   ✅ Corridor watch list + activity signals
 *   ✅ Nearby demand signal summary (from hc_corridor_demand_signals)
 *   ✅ Claim/completion nudges
 *
 *   ❌ No fake load opportunities
 *   ❌ No fake GPS of other operators
 *   ❌ No "live demand" without confirmed demand signals
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Zap, Shield, MapPin, Clock, TrendingUp, Bell, CheckCircle,
  AlertTriangle, ChevronRight, Radio, Star
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface TrustSummary {
  score_total: number;
  score_freshness: number;
  score_proof_conversion: number;
  score_geo_truth: number;
  next_audit_at: string | null;
  sponsor_eligible: boolean;
}

interface CorridorWatchItem {
  corridor_id: string;
  corridor_name: string;
  corridor_slug: string;
  demand_score_cached: number;
  signal_freshness_score: number;
  tier: string;
}

interface Props {
  operatorId: string;
  operatorSlug: string;
  trustBand: 'elite' | 'strong' | 'watch' | 'low' | 'unclaimed';
  profileCompleteness: number;
  isClaimed: boolean;
}

const TRUST_BAND_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  elite:     { label: 'Elite',    color: '#22c55e', icon: '✅' },
  strong:    { label: 'Trusted',  color: '#3b82f6', icon: '🛡️' },
  watch:     { label: 'Active',   color: '#f59e0b', icon: '⚡' },
  low:       { label: 'Building', color: '#94a3b8', icon: '📈' },
  unclaimed: { label: 'Unclaimed',color: '#6b7280', icon: '○' },
};

export function OperatorLivePanel({
  operatorId, operatorSlug, trustBand, profileCompleteness, isClaimed
}: Props) {
  const supabase = createClient();
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableUntil, setAvailableUntil] = useState<string | null>(null);
  const [trustSummary, setTrustSummary] = useState<TrustSummary | null>(null);
  const [watchedCorridors, setWatchedCorridors] = useState<CorridorWatchItem[]>([]);
  const [declaring, setDeclaring] = useState(false);

  // Load availability status
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from('hc_available_now')
        .select('available_until')
        .eq('operator_id', operatorId)
        .gte('available_until', new Date().toISOString())
        .maybeSingle();
      if (data) {
        setIsAvailable(true);
        setAvailableUntil(data.available_until);
      }
    };
    check();
  }, [operatorId, supabase]);

  // Load latest trust audit summary
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profile_audit_runs')
        .select('score_total,score_freshness,score_proof_conversion,score_geo_truth,next_audit_at,sponsor_eligible')
        .eq('hc_id', operatorId)
        .eq('audit_status', 'passed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setTrustSummary(data as TrustSummary);
    };
    load();
  }, [operatorId, supabase]);

  // Load corridor watches with activity
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('hc_corridor_watches')
        .select(`
          corridor_id,
          hc_corridors!inner(name, slug, demand_score_cached, signal_freshness_score, tier)
        `)
        .eq('operator_id', operatorId)
        .limit(5);
      if (data) {
        setWatchedCorridors(data.map((w: any) => ({
          corridor_id: w.corridor_id,
          corridor_name: w.hc_corridors?.name ?? 'Unknown',
          corridor_slug: w.hc_corridors?.slug ?? '',
          demand_score_cached: w.hc_corridors?.demand_score_cached ?? 0,
          signal_freshness_score: w.hc_corridors?.signal_freshness_score ?? 0,
          tier: w.hc_corridors?.tier ?? 'seeded',
        })));
      }
    };
    load();
  }, [operatorId, supabase]);

  const declareAvailable = useCallback(async () => {
    setDeclaring(true);
    try {
      const res = await fetch('/api/operator/declare-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, hours: 8 }),
      });
      if (res.ok) {
        const until = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
        setIsAvailable(true);
        setAvailableUntil(until);
      }
    } finally {
      setDeclaring(false);
    }
  }, [operatorId]);

  const trustInfo = TRUST_BAND_LABELS[trustBand] ?? TRUST_BAND_LABELS.low;
  const nextTrustStep = trustBand === 'watch' || trustBand === 'low'
    ? 'Add certifications or insurance doc to reach Trusted status'
    : trustBand === 'strong' ? 'Maintain fresh profile updates to reach Elite'
    : null;

  return (
    <div className="space-y-4">

      {/* ── Status Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <span className="text-xl">{trustInfo.icon}</span>
          <div>
            <div className="text-sm font-bold" style={{ color: trustInfo.color }}>
              {trustInfo.label} Operator
            </div>
            <div className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">
              {profileCompleteness}% Profile Complete
            </div>
          </div>
        </div>
        <Link href={`/directory/profile/${operatorSlug}`}
          className="text-[11px] font-bold text-amber-400 border border-amber-400/30 rounded-lg px-3 py-1.5 hover:bg-amber-400/10 transition-colors">
          View Profile
        </Link>
      </div>

      {/* ── Availability Toggle ───────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-white">Availability Status</span>
          </div>
          {isAvailable && (
            <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
              DECLARED AVAILABLE
            </span>
          )}
        </div>
        {isAvailable ? (
          <p className="text-[12px] text-white/50">
            Self-reported available until {availableUntil
              ? new Date(availableUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </p>
        ) : (
          <div>
            <p className="text-[12px] text-white/50 mb-3">
              Declare availability so brokers can find you in the live feed.
            </p>
            <button
              onClick={declareAvailable}
              disabled={declaring}
              className="w-full py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {declaring ? 'Declaring…' : '⚡ Declare Available (8 hours)'}
            </button>
            <p className="text-[10px] text-white/30 mt-1 text-center">
              Self-reported — not GPS-verified
            </p>
          </div>
        )}
      </div>

      {/* ── Trust Score Progress ──────────────────────────────────── */}
      {trustSummary && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Trust Score</span>
            <span className="ml-auto text-sm font-black" style={{ color: trustInfo.color }}>
              {Math.round(trustSummary.score_total)}/100
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-white/10 mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${trustSummary.score_total}%`,
                background: `linear-gradient(90deg, ${trustInfo.color}, ${trustInfo.color}80)`
              }}
            />
          </div>
          {/* Component breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Freshness', val: trustSummary.score_freshness },
              { label: 'Proof', val: trustSummary.score_proof_conversion },
              { label: 'Geo Truth', val: trustSummary.score_geo_truth },
            ].map(({ label, val }) => (
              <div key={label} className="p-2 rounded-lg bg-white/[0.03]">
                <div className="text-xs font-bold text-white">{Math.round(val ?? 0)}</div>
                <div className="text-[10px] text-white/40">{label}</div>
              </div>
            ))}
          </div>
          {/* Next step nudge */}
          {nextTrustStep && (
            <div className="mt-3 flex items-start gap-2 p-2 rounded-lg bg-amber-400/5 border border-amber-400/15">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-300/80">{nextTrustStep}</p>
            </div>
          )}
          {trustSummary.sponsor_eligible && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Eligible for sponsored placement
            </div>
          )}
        </div>
      )}

      {/* ── Watched Corridors ────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Watched Corridors</span>
          </div>
          <Link href="/corridors" className="text-[11px] text-amber-400 hover:underline">Browse →</Link>
        </div>
        {watchedCorridors.length === 0 ? (
          <p className="text-[12px] text-white/40">
            Watch corridors to get alerts when demand spikes near you.
          </p>
        ) : (
          <div className="space-y-2">
            {watchedCorridors.map(c => (
              <Link
                key={c.corridor_id}
                href={`/corridors/${c.corridor_slug}`}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <div>
                  <div className="text-[12px] font-semibold text-white">{c.corridor_name}</div>
                  <div className="text-[10px] text-white/40 capitalize">{c.tier} corridor</div>
                </div>
                <div className="text-right">
                  {c.signal_freshness_score >= 80 && (
                    <span className="text-[10px] font-bold text-orange-400">🔥 Active</span>
                  )}
                  {c.signal_freshness_score < 30 && (
                    <span className="text-[10px] font-bold text-white/30">Dormant</span>
                  )}
                  <ChevronRight className="w-3 h-3 text-white/20 ml-1 inline" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Profile Completion Nudges ────────────────────────────── */}
      {(!isClaimed || profileCompleteness < 80) && (
        <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              {!isClaimed && (
                <p className="text-[12px] text-amber-300 font-semibold mb-2">
                  Claim your profile to appear in live dispatch feeds and gain trust score uplift.
                </p>
              )}
              {isClaimed && profileCompleteness < 80 && (
                <p className="text-[12px] text-amber-300 font-semibold mb-2">
                  Complete your profile ({profileCompleteness}% done) to rank higher in searches.
                </p>
              )}
              <Link
                href={`/directory/profile/${operatorSlug}`}
                className="text-[11px] font-bold text-amber-400 hover:underline"
              >
                {!isClaimed ? 'Claim Profile →' : 'Complete Profile →'}
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
