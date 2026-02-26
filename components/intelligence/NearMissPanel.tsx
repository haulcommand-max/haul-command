'use client';

import React from 'react';
import { XCircle, TrendingDown, DollarSign, Users, CloudRain, Clock, MapPin, AlertOctagon } from 'lucide-react';

type FillFailure = {
    id: string;
    load_id: string;
    corridor: string | null;
    origin_state: string | null;
    dest_state: string | null;
    failure_reason: string;
    offered_rate_usd: number | null;
    market_rate_usd: number | null;
    rate_gap_pct: number | null;
    escorts_contacted: number;
    escorts_declined: number;
    escorts_available_in_region: number;
    suggested_rate_usd: number | null;
    supply_gap_flagged: boolean;
    created_at: string;
};

const REASON_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    no_response: { label: 'No Response', icon: Clock, color: 'text-slate-400' },
    rate_too_low: { label: 'Rate Too Low', icon: TrendingDown, color: 'text-red-400' },
    no_available_escorts: { label: 'No Supply', icon: Users, color: 'text-amber-400' },
    timing_conflict: { label: 'Timing Conflict', icon: Clock, color: 'text-blue-400' },
    equipment_mismatch: { label: 'Equipment Mismatch', icon: AlertOctagon, color: 'text-purple-400' },
    broker_canceled: { label: 'Broker Canceled', icon: XCircle, color: 'text-red-500' },
    weather_event: { label: 'Weather Event', icon: CloudRain, color: 'text-cyan-400' },
    permit_delay: { label: 'Permit Delay', icon: Clock, color: 'text-orange-400' },
    unknown: { label: 'Unknown', icon: XCircle, color: 'text-slate-500' },
};

export function NearMissPanel({ failures }: { failures: FillFailure[] }) {
    if (failures.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No fill failures recorded. All loads covered.</p>
            </div>
        );
    }

    const supplyGaps = failures.filter(f => f.supply_gap_flagged).length;
    const rateMisses = failures.filter(f => f.failure_reason === 'rate_too_low').length;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Summary Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                        <h3 className="text-white font-bold">Near-Miss Intelligence</h3>
                        <p className="text-xs text-slate-500">{failures.length} fill failures captured</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {supplyGaps > 0 && (
                        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full">
                            {supplyGaps} supply gap{supplyGaps > 1 ? 's' : ''}
                        </span>
                    )}
                    {rateMisses > 0 && (
                        <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">
                            {rateMisses} rate miss{rateMisses > 1 ? 'es' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Failure List */}
            <div className="divide-y divide-slate-800">
                {failures.slice(0, 10).map(f => {
                    const meta = REASON_LABELS[f.failure_reason] || REASON_LABELS.unknown;
                    const Icon = meta.icon;
                    return (
                        <div key={f.id} className="px-6 py-4 flex items-center gap-4">
                            <Icon className={`w-5 h-5 ${meta.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">{meta.label}</span>
                                    {f.corridor && (
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {f.corridor}
                                        </span>
                                    )}
                                    {f.supply_gap_flagged && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded">Gap</span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {f.escorts_contacted} contacted · {f.escorts_declined} declined · {f.escorts_available_in_region} in region
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                {f.offered_rate_usd != null && f.suggested_rate_usd != null && (
                                    <div className="text-xs">
                                        <span className="text-red-400 line-through">${f.offered_rate_usd}</span>
                                        <span className="text-emerald-400 font-bold ml-2">${f.suggested_rate_usd}</span>
                                    </div>
                                )}
                                {f.rate_gap_pct != null && f.rate_gap_pct > 0 && (
                                    <div className="text-[10px] text-red-400">{f.rate_gap_pct.toFixed(0)}% below market</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
