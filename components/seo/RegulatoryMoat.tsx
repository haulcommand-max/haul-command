import React from 'react';
import { ShieldCheck, Info, AlertTriangle } from 'lucide-react';

interface RegulatoryMoatProps {
    stateName: string;
    escortWidth?: string;
    escortHeight?: string;
    poleTrigger?: string;
    nightRules?: string;
    holidayRules?: string;
    confidence: number;
}

export const RegulatoryMoat: React.FC<RegulatoryMoatProps> = ({
    stateName,
    escortWidth,
    escortHeight,
    poleTrigger,
    nightRules,
    holidayRules,
    confidence
}) => {
    return (
        <div className="bg-slate-900 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-xl my-10">
            <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    {stateName} Regulatory Intelligence
                </h2>
                <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Confidence</span>
                    <span className="text-xs font-bold text-white">{confidence}%</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Escort Threshold (Width)</span>
                        <div className="text-sm text-slate-200 font-medium">{escortWidth || 'N/A'}</div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1">Height Pole Trigger</span>
                        <div className="text-sm text-slate-200 font-medium">{poleTrigger || 'N/A'}</div>
                    </div>
                </div>

                <div className="space-y-4 border-l border-slate-800 pl-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 text-blue-400">Night Restrictions</span>
                        <div className="text-xs text-slate-400 leading-relaxed italic">
                            {nightRules || 'No major restrictions detected.'}
                        </div>
                    </div>
                </div>

                <div className="space-y-4 border-l border-slate-800 pl-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mb-1 text-amber-400">Holiday Curfews</span>
                        <div className="flex items-start gap-2 text-xs text-slate-400 leading-relaxed">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{holidayRules || 'Standard regional curfews apply.'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <AlertTriangle className="w-3 h-3 text-amber-500/50" />
                    <span>Real-time signals verified by Haul Command. Always check your permit.</span>
                </div>
                <button className="text-[10px] font-bold text-amber-500 hover:text-amber-400 uppercase tracking-widest transition-colors flex items-center gap-1 group">
                    View Detailed State FAC 14-26 Code
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    );
};
