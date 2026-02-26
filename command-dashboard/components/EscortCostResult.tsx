
import React from 'react';
import { EscortCostEstimate } from '@/lib/logic/escort_cost_estimator';

interface Props {
    estimate: EscortCostEstimate | null;
    loading: boolean;
}

export const EscortCostResult: React.FC<Props> = ({ estimate, loading }) => {
    if (!estimate) {
        return (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-8 text-center text-gray-500">
                <p>Enter route details to generate estimate.</p>
            </div>
        );
    }

    const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Estimated Cost Range</h3>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded border border-green-500/30">Live Quote</span>
            </div>

            {/* Big Numbers */}
            <div className="p-8 text-center">
                <div className="flex items-baseline justify-center space-x-2">
                    <span className="text-4xl lg:text-5xl font-black text-white">{fmt(estimate.totalCost.min)}</span>
                    <span className="text-gray-500 text-xl font-light">-</span>
                    <span className="text-4xl lg:text-5xl font-black text-white">{fmt(estimate.totalCost.max)}</span>
                </div>
                <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest">Total Estimated Project Cost</p>
            </div>

            {/* Line Items */}
            <div className="px-6 pb-6 space-y-3">
                {Object.entries(estimate.lineItems).map(([key, item]) => (
                    <div key={key} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
                        <div>
                            <span className="text-gray-300 capitalize block">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-gray-500 text-xs">{item.breakdown}</span>
                        </div>
                        <div className="text-right text-gray-300 font-mono">
                            {fmt(item.min)} - {fmt(item.max)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-500/10 p-3 text-center border-t border-yellow-500/20">
                <p className="text-yellow-500/80 text-xs font-medium">{estimate.disclaimer}</p>
            </div>
        </div>
    );
};
