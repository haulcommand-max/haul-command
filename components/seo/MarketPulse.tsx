import React from 'react';
import { Activity, Users, Truck, DollarSign } from 'lucide-react';

interface MarketPulseProps {
    totalProviders: number;
    activeLoads: number;
    avgTrust: number;
    benchmarkLow?: number;
    benchmarkHigh?: number;
    regionCode: string;
}

export const MarketPulse: React.FC<MarketPulseProps> = ({
    totalProviders,
    activeLoads,
    avgTrust,
    benchmarkLow,
    benchmarkHigh,
    regionCode
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
            {/* Provider Density */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-amber-500/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                        <Users className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Liquidity</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{totalProviders}</div>
                <div className="text-xs text-slate-400">Verifed Escorts in Region</div>
            </div>

            {/* Active Demand */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-blue-500/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <Truck className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Demand</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{activeLoads}</div>
                <div className="text-xs text-slate-400">Active High-Wide Loads</div>
            </div>

            {/* Trust Index */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-emerald-500/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Activity className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reliability</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{Math.round(avgTrust)}%</div>
                <div className="text-xs text-slate-400">Market Trust Index</div>
            </div>

            {/* Rate Benchmarks */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-amber-500/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Benchmarks</span>
                </div>
                <div className="text-xl font-bold text-white mb-1">
                    {benchmarkLow && benchmarkHigh ? (
                        <>${benchmarkLow} - ${benchmarkHigh}</>
                    ) : (
                        <span className="text-slate-500 italic">Analysing...</span>
                    )}
                </div>
                <div className="text-xs text-slate-400">{regionCode} Market Guide Rate</div>
            </div>
        </div>
    );
};
