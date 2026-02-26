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

// No mock data in production — show graceful empty state instead
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
        <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                            {dataSource === 'live' ? 'Live Standings' : 'Preview'}
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight">Corridor Dominance</h3>
                    <p className="text-sm text-slate-400 mt-2 max-w-md">
                        Top 3 ranked drivers per corridor receive priority push notifications for new loads <span className="text-white font-bold">60 seconds</span> before the network.
                    </p>
                </div>

                {/* Corridor Selector */}
                <div className="flex bg-[#111] p-1 rounded-xl border border-white/10 shrink-0">
                    {CORRIDORS.map(c => (
                        <button
                            key={c.key}
                            onClick={() => setActiveCorridor(c.key)}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
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
                {/* Table Header */}
                <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 md:px-8 py-3 bg-[#111]/50 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="w-8 text-center">Rank</div>
                    <div>Operator</div>
                    <div className="text-right hidden sm:block">Completed Runs</div>
                    <div className="text-right w-20">Score</div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                    </div>
                )}

                {/* Rows */}
                {!loading && (
                    <div className="divide-y divide-white/5">
                        {leaders.map((driver) => (
                            <div key={`${driver.corridor_slug}-${driver.rank}`} className={cn(
                                "grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 md:px-8 py-4 items-center transition-colors hover:bg-white/[0.02]",
                                driver.rank <= 3 && "bg-amber-500/[0.02]"
                            )}>
                                {/* Rank */}
                                <div className="w-8 text-center flex flex-col items-center justify-center">
                                    {driver.rank === 1 ? (
                                        <Medal className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                    ) : driver.rank === 2 ? (
                                        <Medal className="w-5 h-5 text-slate-300" />
                                    ) : driver.rank === 3 ? (
                                        <Medal className="w-5 h-5 text-amber-700" />
                                    ) : (
                                        <span className="text-lg font-black text-slate-600">{driver.rank}</span>
                                    )}
                                    {driver.rank <= 3 && (
                                        <span className="text-[9px] font-bold text-amber-500 mt-1 uppercase tracking-widest hidden sm:block">Priority</span>
                                    )}
                                </div>

                                {/* Name & Badges */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-base md:text-lg">{driver.display_name || 'Unknown'}</span>
                                        {driver.badges?.includes('Elite') && (
                                            <Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                                        )}
                                        {driver.home_state && (
                                            <span className="text-[10px] text-slate-500 font-medium">{driver.home_state}</span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        {(driver.badges || []).map(b => (
                                            <span key={b} className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 font-medium uppercase tracking-wider">
                                                {b}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="text-right hidden sm:block">
                                    <span className="text-slate-300 font-mono text-sm">{driver.jobs_completed ?? 0}</span>
                                </div>

                                {/* Score */}
                                <div className="text-right w-20">
                                    <div className="text-xl font-black text-emerald-400 font-mono">
                                        {Math.round(driver.score)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer CTA */}
            <div className="p-6 bg-[#111] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-sm text-slate-400">
                        Completing loads and receiving 5-star broker reviews directly impacts your ranking.
                    </p>
                </div>
                <Link href="/auth/signup" className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors">
                    Claim Your Profile <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
