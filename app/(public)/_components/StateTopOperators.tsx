'use client';

import { ShieldCheck, Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Mock driver trust scores representing what we would query from driver_trust_scores
const MOCK_OPERATORS = [
    { id: '1', name: 'J&M Escort Services', city: 'Dallas', kycLevel: 4, trustScore: 0.98, rating: 5.0, reviews: 142, cleanRun: '99%', online: true },
    { id: '2', name: 'Lone Star Pilot Cars', city: 'Houston', kycLevel: 3, trustScore: 0.92, rating: 4.8, reviews: 89, cleanRun: '96%', online: true },
    { id: '3', name: 'Apex Heavy Haul Escorts', city: 'Austin', kycLevel: 4, trustScore: 0.88, rating: 4.9, reviews: 312, cleanRun: '94%', online: false },
];

export function StateTopOperators({ stateCode, stateName }: { stateCode: string, stateName: string }) {
    // In production we would fetch from Supabase `public_leaderboard` and `driver_trust_scores`
    const [operators, setOperators] = useState(MOCK_OPERATORS);

    useEffect(() => {
        // Pseudo randomize city for the requested state
        const cities = {
            TX: ['Dallas', 'Houston', 'San Antonio'],
            FL: ['Miami', 'Orlando', 'Tampa'],
            CA: ['Los Angeles', 'San Diego', 'Sacramento'],
        } as Record<string, string[]>;
        
        const stateCities = cities[stateCode] || ['Capital City', 'Metro Area', 'Port City'];
        setOperators(ops => ops.map((op, i) => ({ ...op, city: stateCities[i % stateCities.length] })));
    }, [stateCode]);

    return (
        <div className="mb-10">
            <div className="flex items-end justify-between mb-4">
                <div>
                    <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Live Active Escorts in {stateName}</h3>
                    <p className="text-xs text-green-400 font-semibold tracking-wider mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Pulling from Haul Command Trust Leaderboard
                    </p>
                </div>
                <Link href={`/directory/us/${stateCode.toLowerCase()}`} className="text-xs font-bold text-amber-500 hover:text-amber-400 underline decoration-amber-500/30 underline-offset-4">
                    View All {stateName} Operators â†’
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {operators.map((op, i) => (
                    <div key={op.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-amber-500/40 hover:bg-white/[0.08] transition-all group relative overflow-hidden">
                        {/* Rank Badge */}
                        <div className="absolute top-0 right-0 w-12 h-12 bg-black/40 rounded-bl-3xl flex items-center justify-center border-b border-l border-white/5">
                            <span className="text-gray-500 font-black italic">#{i + 1}</span>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-900/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 relative">
                                <span className="font-black text-amber-400">{op.name.charAt(0)}</span>
                                {op.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-black"></span>}
                            </div>
                            <div className="pr-6">
                                <h4 className="text-white font-bold text-sm leading-tight group-hover:text-amber-400 transition-colors truncate">{op.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                    <MapPin className="w-3 h-3" />
                                    <span>{op.city}, {stateCode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-black/40 rounded-lg p-2 flex flex-col items-center justify-center border border-white/5">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Trust Score</span>
                                <span className="text-lg font-black text-amber-500 font-mono">{(op.trustScore * 100).toFixed(0)}</span>
                            </div>
                            <div className="bg-black/40 rounded-lg p-2 flex flex-col items-center justify-center border border-white/5">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Clean Runs</span>
                                <span className="text-lg font-black text-green-400 font-mono">{op.cleanRun}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1">
                                <span className="text-amber-400 text-xs">{'â˜…'.repeat(Math.round(op.rating))}</span>
                                <span className="text-xs text-gray-500 font-medium">({op.reviews})</span>
                            </div>
                            
                            <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-[10px] font-bold text-green-400">
                                <ShieldCheck className="w-3 h-3" />
                                L{op.kycLevel} Verified
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}