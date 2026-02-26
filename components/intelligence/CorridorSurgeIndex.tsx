'use client';

import React from 'react';
import { Flame, TrendingUp, ArrowUpRight, Gauge } from 'lucide-react';

type SupplyIndexEntry = {
    corridor_id: string;
    corridor_name: string;
    available_escorts: number;
    active_loads: number;
    supply_demand_ratio: number;
    scarcity_score: number;
    surge_multiplier: number;
};

export function CorridorSurgeIndex({ entries }: { entries: SupplyIndexEntry[] }) {
    const sorted = [...entries].sort((a, b) => b.scarcity_score - a.scarcity_score);
    const surging = entries.filter(e => e.surge_multiplier > 1.3).length;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <div>
                        <h3 className="text-white font-bold">Surge Index</h3>
                        <p className="text-xs text-slate-500">Real-time scarcity → rate multiplier</p>
                    </div>
                </div>
                {surging > 0 && (
                    <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full animate-pulse">
                        {surging} surging
                    </span>
                )}
            </div>

            {/* Corridor Surge List */}
            <div className="divide-y divide-slate-800">
                {sorted.map(entry => {
                    const isSurging = entry.surge_multiplier > 1.3;
                    const surgeColor = entry.surge_multiplier >= 2.0 ? 'text-red-400'
                        : entry.surge_multiplier >= 1.5 ? 'text-orange-400'
                            : entry.surge_multiplier > 1.1 ? 'text-amber-400'
                                : 'text-emerald-400';

                    const barWidth = Math.min(100, entry.scarcity_score);

                    return (
                        <div key={entry.corridor_id} className="px-6 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{entry.corridor_name}</span>
                                    {isSurging && (
                                        <TrendingUp className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className={`text-lg font-black ${surgeColor}`}>
                                            {entry.surge_multiplier.toFixed(1)}x
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Scarcity Bar */}
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${entry.scarcity_score >= 70 ? 'bg-red-500'
                                            : entry.scarcity_score >= 40 ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-600">
                                <span>{entry.available_escorts} escorts avail</span>
                                <span>{entry.active_loads} active loads</span>
                                <span>Scarcity: {entry.scarcity_score.toFixed(0)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
