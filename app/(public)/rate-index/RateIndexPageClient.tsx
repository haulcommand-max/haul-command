"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Minus, Search, Globe, Filter,
    ArrowUpRight, ArrowDownRight, BarChart3, Lock, Zap,
    ChevronDown, ExternalLink, Info
} from 'lucide-react';

// â”€â”€ Types â”€â”€

interface CorridorRow {
    corridor: string;
    origin: string;
    destination: string;
    country: string;
    currency: string;
    avg_rate_per_mile: number | null;
    median_rate_per_mile: number | null;
    rate_range: { p10: number | null; p25: number | null; p75: number | null; p90: number | null };
    by_service: { lead: number | null; chase: number | null; steer: number | null; survey: number | null };
    trend: { direction: string; change_7d_pct: number | null; change_30d_pct: number | null };
    demand: { band: string; observations_7d: number; observations_30d: number };
    sample_count: number;
    last_updated: string;
    detail_available: boolean;
    is_baseline?: boolean;
    day_rate?: { amount: number; currency: string };
}

interface RateIndexResponse {
    status: string;
    total: number;
    live_corridors: number;
    baseline_countries: number;
    last_refresh: string;
    corridors: CorridorRow[];
}

// â”€â”€ Constants â”€â”€

const DEMAND_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    dominant: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'High Demand' },
    strong: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Strong' },
    emerging: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Emerging' },
    cold: { bg: 'bg-[#0A0A0A]0/15', text: 'text-slate-400', label: 'Low Volume' },
    baseline: { bg: 'bg-purple-500/15', text: 'text-purple-400', label: 'Baseline' },
};

const TREND_ICONS: Record<string, React.ReactNode> = {
    rising: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    falling: <TrendingDown className="w-4 h-4 text-red-400" />,
    stable: <Minus className="w-4 h-4 text-slate-400" />,
};

// â”€â”€ Component â”€â”€

export default function RateIndexPageClient() {
    const [data, setData] = useState<RateIndexResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [countryFilter, setCountryFilter] = useState('');
    const [sort, setSort] = useState('demand');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [showProModal, setShowProModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [sort, countryFilter]);

    async function fetchData() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ sort, limit: '100' });
            if (countryFilter) params.set('country', countryFilter);
            const res = await fetch(`/api/public/rate-index?${params}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Failed to fetch rate index:', e);
        } finally {
            setLoading(false);
        }
    }

    const filtered = useMemo(() => {
        if (!data?.corridors) return [];
        if (!search) return data.corridors;
        const q = search.toLowerCase();
        return data.corridors.filter(c =>
            c.corridor.toLowerCase().includes(q) ||
            c.origin.toLowerCase().includes(q) ||
            c.destination.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q)
        );
    }, [data, search]);

    const countries = useMemo(() => {
        if (!data?.corridors) return [];
        return [...new Set(data.corridors.map(c => c.country))].sort();
    }, [data]);

    const formatRate = (rate: number | null, currency: string = 'USD') => {
        if (rate === null || rate === undefined) return '—';
        return `$${rate.toFixed(2)}`;
    };

    const formatPct = (pct: number | null) => {
        if (pct === null || pct === undefined) return '—';
        const sign = pct > 0 ? '+' : '';
        return `${sign}${pct.toFixed(1)}%`;
    };

    return (
        <div className=" bg-[#0a0a0f] text-white">
            {/* â”€â”€ Hero Section â”€â”€ */}
            <div className="relative overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/3 blur-[200px] rounded-full" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-amber-500" />
                        </div>
                        <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">
                            Live Market Intelligence
                        </span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                        Escort Rate
                        <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Index</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-8">
                        The industry's first public rate index for oversize and heavy haul escort services.
                        Live corridor pricing across {countries.length || '57'} countries, updated daily.
                    </p>

                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-6 sm:gap-10">
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white">
                                {data?.live_corridors ?? '—'}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Live Corridors</div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white">
                                {data?.baseline_countries ?? '—'}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Countries Covered</div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white">
                                {data?.total ?? '—'}
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Total Lanes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Filters Bar â”€â”€ */}
            <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search corridors, states, countries..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                                    text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50
                                    focus:ring-1 focus:ring-amber-500/20 transition-all"
                            />
                        </div>

                        {/* Country Filter */}
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <select
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                                    text-white appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50
                                    min-w-[140px]"
                            >
                                <option value="">All Countries</option>
                                {countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                                    text-white appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50
                                    min-w-[140px]"
                            >
                                <option value="demand">By Demand</option>
                                <option value="rate">By Rate</option>
                                <option value="name">By Name</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ Rate Table â”€â”€ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-20" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg font-medium">No corridors match your search</p>
                        <p className="text-sm text-slate-500 mt-2">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Table Header */}
                        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-4">Corridor</div>
                            <div className="col-span-2 text-right">Avg Rate/Mile</div>
                            <div className="col-span-2 text-center">7d Trend</div>
                            <div className="col-span-2 text-center">Demand</div>
                            <div className="col-span-2 text-right">Observations</div>
                        </div>

                        {filtered.map((row) => (
                            <div key={row.corridor + row.country} className="group">
                                {/* Main Row */}
                                <button aria-label="Interactive Button"
                                    onClick={() => setExpandedRow(expandedRow === row.corridor ? null : row.corridor)}
                                    className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 lg:px-6 lg:py-4
                                        bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10
                                        rounded-2xl transition-all duration-200 text-left items-center"
                                >
                                    {/* Corridor Name */}
                                    <div className="lg:col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-500/20
                                            rounded-xl flex items-center justify-center text-xs font-black text-amber-500 shrink-0">
                                            {row.country}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate text-sm lg:text-base">
                                                {row.origin} â†’ {row.destination}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                                {row.corridor}
                                                {row.is_baseline && (
                                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                                                        Baseline
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rate */}
                                    <div className="lg:col-span-2 text-right">
                                        <span className="text-xl lg:text-2xl font-black text-white">
                                            {formatRate(row.avg_rate_per_mile, row.currency)}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">/mi</span>
                                    </div>

                                    {/* Trend */}
                                    <div className="lg:col-span-2 flex items-center justify-center gap-2">
                                        {TREND_ICONS[row.trend.direction] || TREND_ICONS.stable}
                                        <span className={`text-sm font-semibold ${
                                            row.trend.direction === 'rising' ? 'text-emerald-400' :
                                            row.trend.direction === 'falling' ? 'text-red-400' : 'text-slate-400'
                                        }`}>
                                            {formatPct(row.trend.change_7d_pct)}
                                        </span>
                                    </div>

                                    {/* Demand Badge */}
                                    <div className="lg:col-span-2 flex justify-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold
                                            ${(DEMAND_COLORS[row.demand.band] || DEMAND_COLORS.cold).bg}
                                            ${(DEMAND_COLORS[row.demand.band] || DEMAND_COLORS.cold).text}`}>
                                            {(DEMAND_COLORS[row.demand.band] || DEMAND_COLORS.cold).label}
                                        </span>
                                    </div>

                                    {/* Observations */}
                                    <div className="lg:col-span-2 text-right">
                                        <span className="text-sm font-semibold text-slate-300">
                                            {row.demand.observations_30d}
                                        </span>
                                        <span className="text-xs text-slate-500 ml-1">/ 30d</span>
                                    </div>
                                </button>

                                {/* Expanded Detail (PRO-gated) */}
                                {expandedRow === row.corridor && (
                                    <div className="mt-1 bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6
                                        animate-in slide-in-from-top-2 duration-200">
                                        {/* Rate Range */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                                Rate Distribution
                                            </h4>
                                            <div className="grid grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Great Deal', value: row.rate_range.p10, color: 'text-emerald-400' },
                                                    { label: 'Good', value: row.rate_range.p25, color: 'text-emerald-300' },
                                                    { label: 'Above Market', value: row.rate_range.p75, color: 'text-orange-400' },
                                                    { label: 'Premium', value: row.rate_range.p90, color: 'text-red-400' },
                                                ].map(({ label, value, color }) => (
                                                    <div key={label} className="text-center p-3 bg-white/5 rounded-xl">
                                                        <div className={`text-lg font-black ${color}`}>
                                                            {formatRate(value)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-medium mt-1">{label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Service Breakdown + Trend Deep Dive (PRO) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="relative group/pro">
                                                <div className="blur-[2px] pointer-events-none">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                                        By Service Type
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {['Lead Car', 'Chase Car', 'Steer Car', 'Route Survey'].map(s => (
                                                            <div key={s} className="flex justify-between p-2 bg-white/5 rounded-lg">
                                                                <span className="text-sm text-slate-300">{s}</span>
                                                                <span className="font-bold text-white">$X.XX/mi</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button aria-label="Interactive Button"
                                                    onClick={(e) => { e.stopPropagation(); setShowProModal(true); }}
                                                    className="absolute inset-0 flex items-center justify-center /60 rounded-xl
                                                        backdrop-blur-sm"
                                                >
                                                    <div className="text-center">
                                                        <Lock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                                        <span className="text-sm font-bold text-amber-500">Unlock with Pro</span>
                                                    </div>
                                                </button>
                                            </div>
                                            <div className="relative group/pro">
                                                <div className="blur-[2px] pointer-events-none">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                                        30-Day Trend
                                                    </h4>
                                                    <div className="h-32 bg-white/5 rounded-lg flex items-end gap-1 p-3">
                                                        {Array.from({ length: 30 }).map((_, i) => (
                                                            <div key={i} className="flex-1 bg-amber-500/30 rounded-t"
                                                                style={{ height: `${20 + Math.random() * 80}%` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <button aria-label="Interactive Button"
                                                    onClick={(e) => { e.stopPropagation(); setShowProModal(true); }}
                                                    className="absolute inset-0 flex items-center justify-center /60 rounded-xl
                                                        backdrop-blur-sm"
                                                >
                                                    <div className="text-center">
                                                        <Lock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                                        <span className="text-sm font-bold text-amber-500">Unlock with Pro</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-block p-px bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl">
                        <div className="bg-[#0a0a0f] rounded-[15px] px-8 py-8 max-w-lg">
                            <Zap className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-white mb-2">
                                Unlock Full Rate Intelligence
                            </h3>
                            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                                Get per-service breakdowns, trend charts, rate alerts, and API access
                                with Haul Command Pro.
                            </p>
                            <a
                                href="/pricing"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                                    text-white font-black rounded-xl hover:shadow-lg hover:shadow-amber-500/25
                                    transition-all duration-200 text-sm"
                            >
                                Start Free Trial <ArrowUpRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Data Disclaimer */}
                <div className="mt-12 flex items-start gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl max-w-2xl mx-auto">
                    <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Rate data reflects observed escort pricing across Haul Command corridors. Rates vary by
                        load dimensions, permit requirements, time-of-day restrictions, and operator availability.
                        This index is for informational purposes and does not constitute a binding quote.
                        {data?.last_refresh && (
                            <span className="block mt-1 text-slate-600">
                                Last refreshed: {new Date(data.last_refresh).toLocaleDateString()}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* â”€â”€ Pro Modal â”€â”€ */}
            {showProModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowProModal(false)}
                >
                    <div
                        className=" border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Lock className="w-6 h-6 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Pro Feature</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Service-type breakdowns, historical trend charts, rate alerts, and corridor deep-dives
                            are available on <strong className="text-amber-400">Haul Command Pro</strong>.
                        </p>
                        <div className="space-y-3 mb-8">
                            {[
                                'Per-service rate breakdown (Lead, Chase, Steer)',
                                '30-day trend charts with week-over-week deltas',
                                'Rate change alerts via SMS and push',
                                'API access for rate data integration',
                                'Corridor Kings — top brokers per lane',
                            ].map(f => (
                                <div key={f} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                    <span className="text-sm text-slate-300">{f}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button aria-label="Interactive Button"
                                onClick={() => setShowProModal(false)}
                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold
                                    rounded-xl transition-colors text-sm"
                            >
                                Maybe Later
                            </button>
                            <a
                                href="/pricing"
                                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white
                                    font-black rounded-xl text-center text-sm hover:shadow-lg hover:shadow-amber-500/25
                                    transition-all"
                            >
                                View Plans
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}