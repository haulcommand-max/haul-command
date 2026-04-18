import React from 'react';
import Link from 'next/link';
import { Map, Route, Scale, Wrench } from 'lucide-react';

export interface MarketClusterProps {
    marketName: string;
    parentStateName: string;
    nearbyMarkets: Array<{ name: string; url: string }>;
    hotCorridors: Array<{ name: string; url: string; rateTrend?: string }>;
    stateRegulationsUrl: string;
    localTools: Array<{ name: string; url: string }>;
}

/**
 * HC-W2-01 — City / State / Corridor Cluster Expansion
 * Ties city pages, related corridors, regulations, and tools into one crawlable cluster loop.
 */
export function MarketClusterGrid({ 
    marketName, 
    parentStateName, 
    nearbyMarkets, 
    hotCorridors, 
    stateRegulationsUrl, 
    localTools 
}: MarketClusterProps) {
    return (
        <div className="w-full bg-[#0a0d14] rounded-2xl border border-white/[0.06] p-6 lg:p-8">
            <h3 className="text-xl font-bold text-white mb-6">
                Market Intelligence: {marketName}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Hub/Spoke: Nearby Markets */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#C6923A] font-semibold text-sm uppercase tracking-wide">
                        <Map className="w-4 h-4" />
                        Nearby Markets
                    </div>
                    <ul className="space-y-2">
                        {nearbyMarkets.map(m => (
                            <li key={m.url}>
                                <Link href={m.url} className="text-sm text-[#8fa3b8] hover:text-white transition-colors truncate block">
                                    Escorts in {m.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Hub/Spoke: Corridors */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#C6923A] font-semibold text-sm uppercase tracking-wide">
                        <Route className="w-4 h-4" />
                        Active Corridors
                    </div>
                    <ul className="space-y-2">
                        {hotCorridors.map(c => (
                            <li key={c.url}>
                                <Link href={c.url} className="text-sm text-[#8fa3b8] hover:text-white transition-colors flex justify-between items-center group">
                                    <span className="truncate group-hover:text-white">{c.name}</span>
                                    {c.rateTrend && (
                                        <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded text-[#00FF66]">
                                            {c.rateTrend}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Hub/Spoke: Regulations */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#C6923A] font-semibold text-sm uppercase tracking-wide">
                        <Scale className="w-4 h-4" />
                        Compliance
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                        <p className="text-xs text-[#8fa3b8] mb-3">
                            Operating in {marketName} requires compliance with {parentStateName} DOT regulations.
                        </p>
                        <Link href={stateRegulationsUrl} className="text-xs font-bold text-white hover:text-[#C6923A] transition-colors flex items-center gap-1">
                            View {parentStateName} Rules &rarr;
                        </Link>
                    </div>
                </div>

                {/* Hub/Spoke: Tools */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#C6923A] font-semibold text-sm uppercase tracking-wide">
                        <Wrench className="w-4 h-4" />
                        Local Tools
                    </div>
                    <ul className="space-y-2">
                        {localTools.map(t => (
                            <li key={t.url}>
                                <Link href={t.url} className="text-sm text-[#8fa3b8] hover:text-white transition-colors">
                                    {t.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}
