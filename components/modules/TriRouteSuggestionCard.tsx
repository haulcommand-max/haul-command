"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Route, Navigation, Fuel, DollarSign, Clock, Sparkles,
    MapPin, ArrowRight, ChevronDown, ChevronUp, Loader2,
    Star, Zap, TrendingUp
} from 'lucide-react';

interface TriRouteSuggestion {
    load_id: string;
    route: { origin: string; destination: string };
    corridor: string;
    service_type: string;
    deadhead_miles: number;
    rate: { quoted_amount: number | null; per_mile: number | null };
    observed_date: string;
    match_score: number;
    profit_estimate: {
        gross_revenue: number;
        total_expense: number;
        net_profit: number;
        real_rate_per_mile: number;
        is_profitable: boolean;
    };
    badge: 'PRIME_TRIROUTE' | 'STRONG_MATCH' | 'VIABLE_RETURN';
}

interface TriRouteResponse {
    status: string;
    load_id: string;
    reference_load: {
        origin: string;
        destination: string;
        corridor: string;
    };
    suggestions: TriRouteSuggestion[];
    summary: {
        total_matches: number;
        avg_deadhead_miles: number | null;
        best_deadhead_miles: number | null;
        prime_matches: number;
        estimated_savings_miles: number;
    };
}

interface TriRouteSuggestionCardProps {
    loadId: string;
    compact?: boolean;
}

const BADGE_CONFIG = {
    PRIME_TRIROUTE: {
        label: 'Prime TriRoute',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400',
        icon: <Star className="w-3 h-3" />,
    },
    STRONG_MATCH: {
        label: 'Strong Match',
        bg: 'bg-blue-500/10 border-blue-500/20',
        text: 'text-blue-400',
        icon: <Zap className="w-3 h-3" />,
    },
    VIABLE_RETURN: {
        label: 'Viable Return',
        bg: 'bg-slate-500/10 border-slate-500/20',
        text: 'text-slate-400',
        icon: <Navigation className="w-3 h-3" />,
    },
};

export default function TriRouteSuggestionCard({ loadId, compact = false }: TriRouteSuggestionCardProps) {
    const [data, setData] = useState<TriRouteResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(!compact);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTriRoutes();
    }, [loadId]);

    async function fetchTriRoutes() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/loads/triroute?load_id=${loadId}&radius_miles=75&limit=5`);
            const json = await res.json();
            if (json.status === 'ok') {
                setData(json);
            } else {
                setError(json.error || 'Failed to load TriRoute suggestions');
            }
        } catch (e: any) {
            setError(e.message || 'Network error');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl" />
                    <div>
                        <div className="w-24 h-4 bg-white/5 rounded mb-1" />
                        <div className="w-40 h-3 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="h-16 bg-white/5 rounded-xl" />
                    <div className="h-16 bg-white/5 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return null; // Silently hide if no TriRoute data
    }

    if (!data || data.suggestions.length === 0) {
        return (
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 text-center">
                <Route className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No TriRoute matches near this delivery point</p>
            </div>
        );
    }

    const { suggestions, summary, reference_load } = data;

    return (
        <div className="bg-slate-900/80 border border-white/5 hover:border-amber-500/10 rounded-2xl overflow-hidden
            transition-all duration-300">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl">
                        <Route className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-white text-sm">TriRoute</h4>
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full
                                text-[10px] font-bold text-emerald-400">
                                {summary.total_matches} match{summary.total_matches !== 1 ? 'es' : ''}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {summary.prime_matches > 0
                                ? `${summary.prime_matches} prime match${summary.prime_matches !== 1 ? 'es' : ''} under 25mi deadhead`
                                : `Best: ${summary.best_deadhead_miles}mi deadhead`
                            }
                        </p>
                    </div>
                </div>
                {expanded
                    ? <ChevronUp className="w-4 h-4 text-slate-500" />
                    : <ChevronDown className="w-4 h-4 text-slate-500" />
                }
            </button>

            {/* Suggestions List */}
            {expanded && (
                <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {/* Summary Bar */}
                    <div className="flex items-center gap-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-3">
                        <div className="flex-1 text-center">
                            <div className="text-xs text-slate-500">Avg Deadhead</div>
                            <div className="font-black text-white text-sm">{summary.avg_deadhead_miles}mi</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 text-center">
                            <div className="text-xs text-slate-500">Best Match</div>
                            <div className="font-black text-emerald-400 text-sm">{summary.best_deadhead_miles}mi</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 text-center">
                            <div className="text-xs text-slate-500">Miles Saved</div>
                            <div className="font-black text-amber-400 text-sm">~{summary.estimated_savings_miles}mi</div>
                        </div>
                    </div>

                    {/* Individual Suggestions */}
                    {suggestions.map((s, i) => {
                        const badge = BADGE_CONFIG[s.badge] || BADGE_CONFIG.VIABLE_RETURN;
                        return (
                            <div
                                key={s.load_id}
                                className="group/card bg-white/[0.02] hover:bg-white/[0.04] border border-white/5
                                    hover:border-emerald-500/10 rounded-xl p-4 transition-all duration-200 cursor-pointer"
                            >
                                {/* Route + Badge */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-white truncate">
                                                {s.route.origin} → {s.route.destination}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">{s.corridor}</div>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold shrink-0 ${badge.bg} ${badge.text}`}>
                                        {badge.icon} {badge.label}
                                    </span>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                                        <MapPin className="w-3 h-3 text-amber-500 mx-auto mb-1" />
                                        <div className="text-xs font-black text-white">{s.deadhead_miles}mi</div>
                                        <div className="text-[9px] text-slate-500">Deadhead</div>
                                    </div>
                                    <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                                        <DollarSign className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                                        <div className="text-xs font-black text-white">
                                            {s.rate.quoted_amount ? `$${s.rate.quoted_amount}` : '—'}
                                        </div>
                                        <div className="text-[9px] text-slate-500">Quote</div>
                                    </div>
                                    <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                                        <TrendingUp className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                                        <div className={`text-xs font-black ${s.profit_estimate.is_profitable ? 'text-emerald-400' : 'text-red-400'}`}>
                                            ${s.profit_estimate.net_profit}
                                        </div>
                                        <div className="text-[9px] text-slate-500">Net Profit</div>
                                    </div>
                                    <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                                        <Sparkles className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                                        <div className="text-xs font-black text-white">
                                            {Math.round(s.match_score * 100)}%
                                        </div>
                                        <div className="text-[9px] text-slate-500">Score</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
