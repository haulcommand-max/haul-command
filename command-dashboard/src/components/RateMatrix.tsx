import React from 'react';
import { useStore } from '../store/useStore';
import { ArrowUpRight, TrendingDown, Activity, Zap } from 'lucide-react';

const RateMatrix: React.FC = () => {
    const { signals } = useStore();

    // Filter for RAT-S signals
    const rateSignals = signals.filter(s => s.type === 'RAT-S');

    // Simulate "Hot Corridors" analysis (In real app, this would be computed from data)
    const corridors = [
        { id: 'C1', name: 'Houston -> Midland', rate: '$5.45/mi', trend: 'up' },
        { id: 'C2', name: 'Savannah -> Atlanta', rate: '$4.10/mi', trend: 'down' },
        { id: 'C3', name: 'Laredo -> Dallas', rate: '$3.80/mi', trend: 'up' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col h-full shadow-xl">
            <div className="p-4 border-b border-slate-700 bg-blue-900/10 flex items-center justify-between">
                <h2 className="text-blue-400 font-bold flex items-center gap-2">
                    <Activity size={16} />
                    RATE MATRIX
                </h2>
                <span className="text-xs font-mono text-slate-400">MARKET INTELLIGENCE</span>
            </div>

            <div className="p-3 grid grid-cols-1 gap-2">
                {/* Corridors */}
                <div className="mb-2">
                    <h3 className="text-xs text-slate-500 font-bold uppercase mb-2">Dominant Corridors</h3>
                    <div className="space-y-1">
                        {corridors.map(c => (
                            <div key={c.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded text-xs">
                                <span className="text-slate-300 font-medium">{c.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-mono">{c.rate}</span>
                                    {c.trend === 'up' ? <ArrowUpRight size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Signals */}
                <div className="flex-1">
                    <h3 className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                        <Zap size={10} /> Live Broker Offers (Vapi)
                    </h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                        {rateSignals.length === 0 && (
                            <div className="text-slate-600 text-xs italic text-center py-4">Waiting for Vapi signals...</div>
                        )}
                        {rateSignals.map(s => (
                            <div key={s.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border-l-2 border-purple-500 text-xs">
                                <span className="text-slate-300 truncate w-1/2">{s.source}</span>
                                <span className="text-purple-300 font-mono font-bold">
                                    ${(s.payload.offer || 0).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RateMatrix;
