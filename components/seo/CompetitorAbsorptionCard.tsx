import React from 'react';
import { ArrowRight, Crosshair } from 'lucide-react';
import Link from 'next/link';

export interface CompetitorAbsorptionProps {
    targetAudience: 'brokers' | 'operators' | 'sponsors';
    competitorType: string; // e.g., 'Static Directory', 'Manual Load Boards', 'Legacy Compliance PDFs'
    valueProp: string;
}

/**
 * HC-W3-08 — Competitor Absorption Page System
 * Specifically targets and absorbs competitor use-cases dynamically.
 */
export function CompetitorAbsorptionCard({ targetAudience, competitorType, valueProp }: CompetitorAbsorptionProps) {
    return (
        <div className="relative isolate w-full bg-gradient-to-r from-[#1A1105] to-[#0A0D14] border border-[#C6923A]/30 rounded-2xl p-6 sm:p-8 overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crosshair className="w-32 h-32 text-[#C6923A]" />
            </div>
            
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#C6923A] bg-[#C6923A]/10 px-2 py-1 rounded uppercase tracking-[0.2em]">
                        Upgrade Your Stack
                    </span>
                </div>
                
                <h3 className="text-xl sm:text-2xl font-black text-white">
                    Still relying on a <span className="line-through text-white/30 truncate">{competitorType}</span>?
                </h3>
                
                <p className="text-base text-[#8FA3B8] max-w-2xl leading-relaxed">
                    {valueProp}
                </p>

                <div className="mt-4">
                    <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm font-bold text-[#C6923A] hover:text-white transition-colors group-hover:translate-x-1 duration-300">
                        Migrate to Haul Command
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
