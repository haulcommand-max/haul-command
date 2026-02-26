import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

const MoneyTicker: React.FC = () => {
    const { financials } = useStore();
    const [savedFees, setSavedFees] = useState(124500); // Starting baseline

    // Simulate "Factoring Fees Saved" incrementing (The Monopoly Lever)
    useEffect(() => {
        const interval = setInterval(() => {
            setSavedFees(prev => prev + (Math.random() * 5));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const totalVolume = financials.reduce((acc, curr) => acc + (curr.payload.value || 0), 0);

    return (
        <div className="bg-slate-900 border-t border-slate-700 h-16 flex items-center px-4 overflow-hidden shadow-2xl relative z-50">
            <div className="flex items-center gap-6 mr-10 border-r border-slate-700 pr-6">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Est. Factoring Fees Saved</span>
                    <span className="text-xl font-bold text-green-400 font-mono flex items-center gap-1">
                        <TrendingUp size={16} />
                        ${savedFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="flex-1 flex gap-8 items-center animate-scroll whitespace-nowrap overflow-x-hidden relative">
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>

                {financials.length === 0 && (
                    <span className="text-slate-500 font-mono text-sm">waiting for settlement stream...</span>
                )}

                {financials.map((tx) => (
                    <div key={tx.id} className="inline-flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700/50">
                        <div className="bg-blue-500/20 p-1 rounded-full">
                            <CreditCard size={12} className="text-blue-400" />
                        </div>
                        <span className="text-xs text-slate-300 font-mono">{tx.source}</span>
                        <span className="text-sm font-bold text-white font-mono">
                            ${(tx.payload.value || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase">{tx.payload.status || 'SETTLED'}</span>
                    </div>
                ))}
            </div>

            <div className="ml-4 pl-4 border-l border-slate-700 flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Session Volume</span>
                <span className="text-lg font-bold text-white font-mono">${totalVolume.toLocaleString()}</span>
            </div>
        </div>
    );
};

export default MoneyTicker;
