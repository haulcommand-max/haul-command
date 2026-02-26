'use client';

import React from 'react';
import { Activity, Wifi, WifiOff, Clock, Wrench } from 'lucide-react';

type ReadinessData = {
    readiness_score: number;
    is_available: boolean;
    last_active_at: string | null;
    avg_response_seconds: number | null;
    equipment_completeness_pct: number;
};

function SignalDot({ active, label }: { active: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={`text-[10px] font-medium uppercase tracking-wider ${active ? 'text-emerald-400' : 'text-slate-600'}`}>{label}</span>
        </div>
    );
}

export function ReadinessScoreBadge({ data, compact = false }: { data: ReadinessData; compact?: boolean }) {
    const score = data.readiness_score;
    const tier = score >= 75 ? 'Ready Now' : score >= 40 ? 'Standby' : 'Offline';
    const tierColor = score >= 75 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-slate-500';
    const ringColor = score >= 75 ? 'border-emerald-500' : score >= 40 ? 'border-amber-500' : 'border-slate-700';

    const lastActiveMinutes = data.last_active_at
        ? Math.floor((Date.now() - new Date(data.last_active_at).getTime()) / 60000)
        : null;
    const lastActiveLabel = lastActiveMinutes != null
        ? lastActiveMinutes < 5 ? 'just now' : lastActiveMinutes < 60 ? `${lastActiveMinutes}m` : `${Math.floor(lastActiveMinutes / 60)}h`
        : '—';

    const responseLabel = data.avg_response_seconds != null
        ? data.avg_response_seconds < 60 ? `${data.avg_response_seconds}s` : `${Math.floor(data.avg_response_seconds / 60)}m`
        : '—';

    if (compact) {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${ringColor} bg-slate-900`}>
                <Activity className={`w-3.5 h-3.5 ${tierColor}`} />
                <span className={`text-xs font-black ${tierColor}`}>{score.toFixed(0)}</span>
                <span className="text-[10px] text-slate-500">{tier}</span>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className={`w-5 h-5 ${tierColor}`} />
                    <span className="text-white font-bold">Readiness</span>
                </div>
                <div className={`text-2xl font-black ${tierColor}`}>{score.toFixed(0)}</div>
            </div>

            {/* Signal breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                    {data.is_available ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-slate-600" />}
                    <span className={data.is_available ? 'text-emerald-400 font-medium' : 'text-slate-600'}>
                        {data.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-slate-300">Active {lastActiveLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-300">Resp: {responseLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-300">Equip: {data.equipment_completeness_pct.toFixed(0)}%</span>
                </div>
            </div>

            {/* Score Bar */}
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${score >= 75 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-slate-600'}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-slate-600 uppercase tracking-widest">
                <span>Offline</span>
                <span>Standby</span>
                <span>Ready Now</span>
            </div>
        </div>
    );
}
