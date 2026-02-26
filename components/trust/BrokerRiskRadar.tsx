'use client';

import React from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, Clock, Ban, Ghost, DollarSign } from 'lucide-react';

type BrokerScoreData = {
    broker_id: string;
    broker_name: string;
    payment_velocity_score: number;
    dispute_frequency_score: number;
    cancellation_behavior_score: number;
    ghosting_reports: number;
    composite_trust_score: number;
    total_jobs_posted: number;
    total_jobs_filled: number;
    avg_payment_days: number | null;
};

function ScoreBar({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    const pct = Math.min(100, Math.max(0, value));
    const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex items-center gap-3">
            <Icon className={`w-4 h-4 ${color} shrink-0`} />
            <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-300">{label}</span>
                    <span className="font-bold text-white">{pct.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
            </div>
        </div>
    );
}

export function BrokerRiskRadar({ score }: { score: BrokerScoreData }) {
    const composite = score.composite_trust_score;
    const tier = composite >= 80 ? 'Trusted' : composite >= 50 ? 'Standard' : 'Caution';
    const tierColor = composite >= 80 ? 'text-emerald-400' : composite >= 50 ? 'text-amber-400' : 'text-red-400';
    const tierBg = composite >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : composite >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
    const fillRate = score.total_jobs_posted > 0 ? ((score.total_jobs_filled / score.total_jobs_posted) * 100).toFixed(0) : '—';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ShieldAlert className={`w-5 h-5 ${tierColor}`} />
                    <div>
                        <h3 className="text-white font-bold text-lg">{score.broker_name}</h3>
                        <p className="text-xs text-slate-500">{score.total_jobs_posted} jobs posted · {fillRate}% fill rate</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${tierBg} ${tierColor}`}>
                    {tier}
                </div>
            </div>

            {/* Composite Score */}
            <div className="text-center mb-6">
                <div className={`text-5xl font-black ${tierColor}`}>{composite.toFixed(0)}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Broker Trust Score</div>
            </div>

            {/* Signal Breakdown */}
            <div className="space-y-4">
                <ScoreBar label="Payment Speed" value={score.payment_velocity_score} icon={DollarSign} color="text-emerald-400" />
                <ScoreBar label="Dispute Frequency" value={score.dispute_frequency_score} icon={AlertTriangle} color="text-amber-400" />
                <ScoreBar label="Cancellation Behavior" value={score.cancellation_behavior_score} icon={Ban} color="text-blue-400" />
            </div>

            {/* Ghosting Warning */}
            {score.ghosting_reports > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium">
                    <Ghost className="w-4 h-4" />
                    {score.ghosting_reports} ghosting report{score.ghosting_reports > 1 ? 's' : ''} filed by escorts
                </div>
            )}

            {/* Payment Speed */}
            {score.avg_payment_days != null && (
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Avg payment: <span className={`font-bold ${score.avg_payment_days <= 7 ? 'text-emerald-400' : score.avg_payment_days <= 30 ? 'text-amber-400' : 'text-red-400'}`}>
                        {score.avg_payment_days} days
                    </span>
                </div>
            )}
        </div>
    );
}
