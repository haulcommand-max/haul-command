"use client";

import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Star, MapPin, ChevronRight, Phone, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MatchCandidate {
    id: string;
    name: string;
    distance: number;
    rating: number;
    trustScore: number;
    isVerified: boolean;
    equipment: string[];
    priceEstimate: number;
}

export const LiveMatchFlow: React.FC<{ loadId?: string }> = ({ loadId }) => {
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch real candidates from match engine
    useEffect(() => {
        async function fetchCandidates() {
            setLoading(true);
            try {
                if (!loadId) {
                    setCandidates([]);
                    return;
                }
                const supabase = createClient();
                const { data, error } = await supabase
                    .rpc('match_candidates_for_load', { p_load_id: loadId })

                if (!error && data && data.length > 0) {
                    setCandidates(data.map((d: any) => ({
                        id: d.driver_id || d.id,
                        name: d.display_name || d.company_name || 'Escort Operator',
                        distance: d.distance_miles || 0,
                        rating: d.avg_rating || 0,
                        trustScore: d.trust_score || 0,
                        isVerified: d.is_verified || false,
                        equipment: d.equipment || [],
                        priceEstimate: d.rate_estimate || 0,
                    })));
                } else {
                    setCandidates([]);
                }
            } catch {
                setCandidates([]);
            } finally {
                setLoading(false);
            }
        }
        fetchCandidates();
    }, [loadId]);

    const handleDispatch = async (id: string) => {
        setIsMatching(true);
        try {
            const supabase = createClient();
            await supabase.from('jobs').insert({
                load_id: loadId,
                escort_id: id,
                status: 'pending',
            });
            // Could trigger push notification here
        } catch {
            // Handle error
        } finally {
            setIsMatching(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-lg mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950 rounded-xl">
                        <Zap className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">Instant Match</h2>
                        <p className="text-[10px] font-bold text-slate-950/70 uppercase tracking-widest leading-none mt-1">
                            Top Tier Availability • Real-Time
                        </p>
                    </div>
                </div>
            </div>

            {/* Match List */}
            <div className="p-4 space-y-4">
                {loading && (
                    <div className="flex items-center justify-center py-8 gap-2">
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                        <span className="text-xs text-slate-500 font-bold uppercase">Finding matches…</span>
                    </div>
                )}

                {!loading && candidates.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-sm text-slate-500 font-bold">No matches available</div>
                        <p className="text-xs text-slate-600 mt-2">
                            We&apos;re expanding the search radius. Escorts in nearby corridors will be notified.
                        </p>
                    </div>
                )}

                {candidates.map((c) => (
                    <div
                        key={c.id}
                        className={`relative p-5 rounded-2xl border transition-all cursor-pointer ${selectedMatch === c.id
                            ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                            }`}
                        onClick={() => setSelectedMatch(c.id)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-white">{c.name}</h3>
                                    {c.isVerified && (
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {c.distance}mi away
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                        {c.rating}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-white">${c.priceEstimate}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Est. Cost</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {c.equipment.map(e => (
                                <span key={e} className="px-2 py-0.5 bg-slate-800 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {e}
                                </span>
                            ))}
                        </div>

                        {selectedMatch === c.id && (
                            <button
                                disabled={isMatching}
                                onClick={(e) => { e.stopPropagation(); handleDispatch(c.id); }}
                                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-2 group"
                            >
                                {isMatching ? (
                                    <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Confirm & Dispatch Now
                                    </>
                                )}
                            </button>
                        )}

                        {/* Trust Meter */}
                        <div className="absolute top-0 right-0 p-2">
                            <div className="w-1.5 h-10 bg-slate-800 rounded-full overflow-hidden flex flex-col justify-end">
                                <div className="bg-emerald-500 w-full" style={{ height: `${c.trustScore}%` }} />
                            </div>
                        </div>
                    </div>
                ))}

                <div className="p-4 bg-slate-950/30 border border-slate-800/50 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500/50 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        Prices are estimated based on regional market benchmarks. Final settlement occurs via HaulPay escrow rules.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <button className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 rotate-180" />
                    Back to Manual
                </button>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Step 2 of 3</span>
                </div>
            </div>
        </div>
    );
};
