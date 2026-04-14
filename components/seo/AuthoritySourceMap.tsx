import React from 'react';
import { Database, ShieldCheck, CheckCircle2, History } from 'lucide-react';
import Link from 'next/link';

export interface AuthoritySourceMapProps {
    region: string;
    lastVerified: string;
    confidenceSignals: string[];
}

/**
 * HC-W3-02 — Official Source Map + Authority Layer
 * Displays official source maps, freshness states, and confidence states.
 * Google’s people-first posture rewards reliable, well-sourced content.
 */
export function AuthoritySourceMap({ region, lastVerified, confidenceSignals }: AuthoritySourceMapProps) {
    return (
        <div className="w-full bg-[#050608] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] bg-[#0A0D14] flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.15em] text-white">
                    Authority Root
                </h4>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#3B82F6]/10 text-[#3B82F6]">
                    <Database className="w-3 h-3" />
                    Live Sync
                </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
                <div>
                    <h5 className="text-[11px] font-bold text-[#5A6577] uppercase tracking-wider mb-2">Primary Ingestion</h5>
                    <p className="text-sm text-white/80 leading-relaxed">
                        Data payload for <span className="text-white font-medium">{region}</span> is actively governed by real-time regulatory ingestion loops and multi-point entity reconciliation.
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <h5 className="text-[11px] font-bold text-[#5A6577] uppercase tracking-wider mb-1">Verification Vectors</h5>
                    {confidenceSignals.map((signal, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-[#8FA3B8]">
                            <ShieldCheck className="w-4 h-4 text-[#C6923A]" />
                            {signal}
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/[0.04] px-5 py-3 bg-white/[0.01] flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-[#5A6577] hover:text-white transition-colors text-xs font-semibold cursor-help">
                    <History className="w-3.5 h-3.5" />
                    Last Verified: {lastVerified}
                </div>
                <Link href="/trust" className="text-xs font-bold text-[#C6923A] hover:underline">
                    View Ledger
                </Link>
            </div>
        </div>
    );
}
