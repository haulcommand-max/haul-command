'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Shield, TrendingUp, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DriverRank {
    corridor_slug: string;
    rank: number;
    score: number;
    display_name: string | null;
    home_state: string | null;
    badges: string[] | null;
    verified_score: number | null;
    response_time_minutes_est: number | null;
    jobs_completed: number | null;
}

const EMPTY_FALLBACK: DriverRank[] = [];

const CORRIDORS = [
    { key: 'tx-triangle', label: 'Texas Triangle' },
    { key: 'i-95', label: 'I-95 Corridor' },
];

export function CorridorLeaderboard() {
    const [activeCorridor, setActiveCorridor] = useState(CORRIDORS[0].key);
    const [leaders, setLeaders] = useState<DriverRank[]>([]);
    const [loading, setLoading] = useState(true);
    const [dataSource, setDataSource] = useState<'live' | 'empty'>('empty');

    useEffect(() => {
        let cancelled = false;
        async function fetchLeaders() {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('v_corridor_leaderboard')
                    .select('*')
                    .eq('corridor_slug', activeCorridor)
                    .order('rank', { ascending: true })
                    .limit(10);

                if (!cancelled) {
                    if (!error && data && data.length > 0) {
                        setLeaders(data.map(d => ({
                            ...d,
                            badges: Array.isArray(d.badges) ? d.badges : [],
                        })));
                        setDataSource('live');
                    } else {
                        setLeaders(EMPTY_FALLBACK);
                        setDataSource('empty');
                    }
                }
            } catch {
                if (!cancelled) {
                    setLeaders(EMPTY_FALLBACK);
                    setDataSource('empty');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchLeaders();
        return () => { cancelled = true; };
    }, [activeCorridor]);

    return (
        <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative">
            <style>{`
                /* ── Mobile-first leaderboard ── */
                .lb-header { padding: 16px; }
                .lb-title { font-size: 18px; }
                .lb-subtitle { font-size: 12px; max-width: none; }
                .lb-tabs { margin-top: 12px; }
                .lb-tab { padding: 8px 14px; min-height: 40px; font-size: 11px; }
                .lb-row { padding: 12px 16px; }
                .lb-rank-medal { width: 20px; height: 20px; }
                .lb-rank-num { font-size: 14px; }
                .lb-name { font-size: 13px; }
                .lb-score { font-size: 16px; }
                .lb-badge { font-size: 8px; padding: 2px 5px; }
                .lb-footer { padding: 16px; }
                /* Desktop table columns — hidden on mobile */
                .lb-desktop-col { display: none; }
                .lb-table-header { display: none; }

                @media (min-width: 768px) {
                    .lb-header { padding: 24px 32px; }
                    .lb-title { font-size: 28px; }
                    .lb-subtitle { font-size: 14px; max-width: 28rem; }
                    .lb-tab { padding: 8px 16px; min-height: 44px; font-size: 12px; }
                    .lb-row { padding: 16px 32px; }
                    .lb-rank-medal { width: 24px; height: 24px; }
                    .lb-name { font-size: 16px; }
                    .lb-score { font-size: 20px; }
                    .lb-badge { font-size: 9px; padding: 2px 6px; }
                    .lb-footer { padding: 24px; }
                    .lb-desktop-col { display: block; }
                    .lb-table-header {
                        display: grid;
                        grid-template-columns: 40px 1fr auto auto;
                        gap: 16px;
                    }
                }
            `}</style>

            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="lb-header border-b border-white/5 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        {dataSource === 'live' ? 'Live Standings' : 'Preview'}
                    </span>
                </div>
                <h3 className="lb-title font-black text-white tracking-tight">Corridor Dominance</h3>
                <p className="lb-subtitle text-slate-400 mt-1">
                    Top 3 ranked drivers get priority load notifications <span className="text-white font-bold">60s</span> before the network.
                </p>

                {/* Corridor Selector */}
                <div className="lb-tabs flex bg-[#111] p-1 rounded-xl border border-white/10 w-fit">
                    {CORRIDORS.map(c => (
                        <button
                            key={c.key}
                            onClick={() => setActiveCorridor(c.key)}
                            className={cn(
                                "lb-tab rounded-full font-bold transition-all whitespace-nowrap",
                                activeCorridor === c.key ? "bg-amber-500 text-black shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="relative z-10">
                {/* Table Header — desktop only */}
                <div className="lb-table-header px-8 py-3 bg-[#111]/50 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="w-8 text-center">Rank</div>
                    <div>Operator</div>
                    <div className="text-right">Runs</div>
                    <div className="text-right w-20">Score</div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                    </div>
                )}

                {/* Rows */}
                {!loading && (
                    <div className="divide-y divide-white/5">
                        {leaders.map((driver) => (
                            <div key={`${driver.corridor_slug}-${driver.rank}`} className={cn(
                                "lb-row flex items-center gap-3 transition-colors hover:bg-white/[0.02]",
                                driver.rank <= 3 && "bg-amber-500/[0.02]"
                            )}>
                                {/* Rank */}
                                <div className="w-7 text-center flex-shrink-0">
                                    {driver.rank === 1 ? (
                                        <Medal className="lb-rank-medal text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)] mx-auto" />
                                    ) : driver.rank === 2 ? (
                                        <Medal className="lb-rank-medal text-slate-300 mx-auto" />
                                    ) : driver.rank === 3 ? (
                                        <Medal className="lb-rank-medal text-amber-700 mx-auto" />
                                    ) : (
                                        <span className="lb-rank-num font-black text-slate-600">{driver.rank}</span>
                                    )}
                                </div>

                                {/* Name + Badges */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="lb-name font-bold text-white truncate">{driver.display_name || 'Unknown'}</span>
                                        {driver.badges?.includes('Elite') && (
                                            <Shield className="w-3 h-3 text-blue-500 fill-blue-500/20 flex-shrink-0" />
                                        )}
                                        {driver.home_state && (
                                            <span className="text-[9px] text-slate-500 font-medium flex-shrink-0">{driver.home_state}</span>
                                        )}
                                    </div>
                                    {(driver.badges || []).length > 0 && (
                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                            {(driver.badges || []).map(b => (
                                                <span key={b} className="lb-badge rounded border border-white/10 bg-white/5 text-slate-400 font-medium uppercase tracking-wider">
                                                    {b}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Desktop: Completed Runs */}
                                <div className="lb-desktop-col text-right">
                                    <span className="text-slate-300 font-mono text-sm">{driver.jobs_completed ?? 0}</span>
                                </div>

                                {/* Score — always visible */}
                                <div className="text-right flex-shrink-0">
                                    <div className="lb-score font-black text-emerald-400 font-mono">
                                        {Math.round(driver.score)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <div className="lb-footer bg-[#111] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-xs text-slate-400">
                        Complete loads + earn 5-star reviews to improve your rank.
                    </p>
                </div>
                <Link href="/auth/signup" className="text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors whitespace-nowrap">
                    Claim Your Profile <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
