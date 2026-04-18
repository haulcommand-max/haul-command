import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck } from 'lucide-react';

export interface AdGridSponsor {
    tier: 'elite' | 'standard';
    companyName: string;
    primaryService: string;
    trustScore: number;
    profileUrl: string;
    imageUrl?: string;
    isNative: boolean; // Tells Google this is a first-party contextual ad, not a blind 3rd party frame
}

export interface HighIntentAdGridProps {
    intentContext: string; // e.g. "Texas Heavy Haul Escorts"
    sponsors: AdGridSponsor[];
}

/**
 * HC-W2-06 — AdGrid Inventory Layer on High-Intent Pages
 * Monetizes highest purchase intent pages by smoothly blending contextual sponsors into the organic UX flow.
 */
export function HighIntentAdGrid({ intentContext, sponsors }: HighIntentAdGridProps) {
    if (!sponsors || sponsors.length === 0) return null;

    return (
        <div className="w-full my-8">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-[#8fa3b8] uppercase tracking-[0.1em]">
                    Sponsored Providers: {intentContext}
                </h4>
                <Link href="/sponsor" className="text-[10px] font-semibold text-[#5A6577] hover:text-white transition-colors uppercase tracking-wider">
                    Claim Top Spot
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sponsors.map((sponsor, idx) => (
                    <Link
                        key={idx}
                        href={sponsor.profileUrl}
                        className={`
                            relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group overflow-hidden
                            ${sponsor.tier === 'elite' 
                                ? 'bg-gradient-to-br from-[#C6923A]/10 to-[rgba(15,20,32,1)] border-[#C6923A]/30 hover:border-[#C6923A] shadow-[0_0_15px_rgba(198,146,58,0.05)]' 
                                : 'bg-[#0a0d14] border-white/[0.08] hover:bg-white/[0.04]'
                            }
                        `}
                    >
                        {/* Native Ad Label */}
                        <div className="absolute top-0 right-0 bg-white/[0.05] text-[#5A6577] text-[9px] font-bold uppercase py-0.5 px-2 rounded-bl-lg">
                            Sponsored
                        </div>

                        <div className="flex items-center gap-3 z-10">
                            {/* Avatar placeholder / image */}
                            <div className="w-10 h-10 rounded shadow-inner bg-black/50 border border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {sponsor.imageUrl ? (
                                    <img src={sponsor.imageUrl} alt={sponsor.companyName} className="w-full h-full object-cover" />
                                ) : (
                                    <Star className={`w-4 h-4 ${sponsor.tier === 'elite' ? 'text-[#C6923A]' : 'text-[#8fa3b8]'}`} />
                                )}
                            </div>

                            <div>
                                <h5 className="text-sm font-bold text-white group-hover:text-[#C6923A] transition-colors truncate max-w-[150px]">
                                    {sponsor.companyName}
                                </h5>
                                <div className="text-[11px] text-[#8fa3b8] truncate">
                                    {sponsor.primaryService}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 z-10">
                            <div className="flex items-center gap-1 bg-[#00FF66]/10 px-1.5 py-0.5 rounded text-[10px] text-[#00FF66] font-bold">
                                <ShieldCheck className="w-3 h-3" />
                                {sponsor.trustScore}
                            </div>
                        </div>

                        {/* Subtle interactive hover light */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
