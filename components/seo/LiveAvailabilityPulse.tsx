import React from 'react';
import { Activity, Clock } from 'lucide-react';
import Link from 'next/link';

export interface PulseSignal {
    id: string;
    type: 'repositioning' | 'available_now' | 'backhaul' | 'survey_complete';
    operatorName: string;
    locationLabel: string;
    timestamp: string; // e.g. "10 mins ago"
    actionUrl: string;
}

export interface LiveAvailabilityPulseProps {
    marketName: string;
    recentSignals: PulseSignal[];
}

/**
 * HC-W2-04 & HC-W2-08 — Available-Now / Repositioning / Social Gravity
 * Ensures destination pages look alive with truthful, real-time-feeling signals.
 */
export function LiveAvailabilityPulse({ marketName, recentSignals }: LiveAvailabilityPulseProps) {
    if (!recentSignals || recentSignals.length === 0) return null;

    return (
        <div className="w-full bg-[#080b11] border border-white/[0.04] rounded-2xl overflow-hidden relative">
            
            {/* Header */}
            <div className="bg-white/[0.02] border-b border-white/[0.04] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF66] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF66]"></span>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Live Market Pulse: {marketName}
                    </span>
                </div>
                <Activity className="w-4 h-4 text-[#5A6577]" />
            </div>

            {/* Signal Feed */}
            <div className="flex flex-col divide-y divide-white/[0.02]">
                {recentSignals.map(sig => (
                    <div key={sig.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                                    ${sig.type === 'available_now' ? 'bg-[#00FF66]/10 text-[#00FF66]' : ''}
                                    ${sig.type === 'backhaul' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : ''}
                                    ${sig.type === 'repositioning' ? 'bg-[#C6923A]/10 text-[#C6923A]' : ''}
                                    ${sig.type === 'survey_complete' ? 'bg-purple-500/10 text-purple-400' : ''}
                                `}>
                                    {sig.type.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-[#5A6577] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {sig.timestamp}
                                </span>
                            </div>
                            <p className="text-sm text-white">
                                <span className="font-semibold text-white/90">{sig.operatorName}</span> reported active in <span className="text-white/70">{sig.locationLabel}</span>
                            </p>
                        </div>
                        <Link 
                            href={sig.actionUrl}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold px-3 py-1.5 rounded text-white"
                        >
                            View
                        </Link>
                    </div>
                ))}
            </div>
            
            {/* Footer Hook */}
            <div className="p-3 border-t border-white/[0.04] bg-[#050608] text-center">
                <p className="text-xs text-[#5A6577]">
                    Pulse relies on live telematics and network reports. <Link href="/claim" className="text-[#C6923A] hover:underline">Broadcast your status.</Link>
                </p>
            </div>
        </div>
    );
}
