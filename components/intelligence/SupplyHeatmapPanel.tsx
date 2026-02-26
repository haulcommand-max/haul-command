'use client';

import React from 'react';
import { MapPin, Users, AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react';

type CorridorSupply = {
    corridor_id: string;
    corridor_name: string;
    available_escorts: number;
    total_escorts: number;
    recent_fill_failures: number;
    avg_rate_gap_pct: number;
    supply_tier: 'dead_zone' | 'weak' | 'moderate' | 'strong';
};

const TIER_CONFIG = {
    dead_zone: { label: 'Dead Zone', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500' },
    weak: { label: 'Weak', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' },
    moderate: { label: 'Moderate', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500' },
    strong: { label: 'Strong', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
};

export function SupplyHeatmapPanel({ corridors }: { corridors: CorridorSupply[] }) {
    const sorted = [...corridors].sort((a, b) => {
        const tierOrder = { dead_zone: 0, weak: 1, moderate: 2, strong: 3 };
        return tierOrder[a.supply_tier] - tierOrder[b.supply_tier];
    });

    const deadZones = corridors.filter(c => c.supply_tier === 'dead_zone').length;
    const weakZones = corridors.filter(c => c.supply_tier === 'weak').length;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-amber-500" />
                    <div>
                        <h3 className="text-white font-bold">Supply Heatmap</h3>
                        <p className="text-xs text-slate-500">{corridors.length} corridors tracked</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {deadZones > 0 && (
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">
                            {deadZones} dead
                        </span>
                    )}
                    {weakZones > 0 && (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                            {weakZones} weak
                        </span>
                    )}
                </div>
            </div>

            {/* Corridor List */}
            <div className="divide-y divide-slate-800">
                {sorted.map(corridor => {
                    const tier = TIER_CONFIG[corridor.supply_tier];
                    const utilization = corridor.total_escorts > 0
                        ? ((corridor.available_escorts / corridor.total_escorts) * 100).toFixed(0)
                        : '0';

                    return (
                        <div key={corridor.corridor_id} className="px-6 py-4 flex items-center gap-4">
                            {/* Tier Indicator */}
                            <div className={`w-2.5 h-2.5 rounded-full ${tier.dot} shrink-0`} />

                            {/* Corridor Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{corridor.corridor_name}</span>
                                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${tier.bg} ${tier.color}`}>
                                        {tier.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {corridor.available_escorts}/{corridor.total_escorts} available
                                    </span>
                                    {corridor.recent_fill_failures > 0 && (
                                        <span className="flex items-center gap-1 text-red-400">
                                            <AlertTriangle className="w-3 h-3" /> {corridor.recent_fill_failures} failures
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="text-right shrink-0">
                                <div className={`text-lg font-black ${tier.color}`}>{utilization}%</div>
                                <div className="text-[10px] text-slate-600 uppercase">Supply</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
