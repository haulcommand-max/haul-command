'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Navigation2, Ruler, MapPin, Map, Navigation, ArrowRight, Zap, Ban } from 'lucide-react';

export default function OfferDeck({ initialOffers, userId }: { initialOffers: any[]; userId: string }) {
    const supabase = createClient();
    const router = useRouter();
    const [offers, setOffers] = useState(initialOffers);
    const [acting, setActing] = useState<string | null>(null);

    const activeOffer = offers[0]; // Just Top of deck

    const handleAction = async (action: 'accept' | 'decline') => {
        if (!activeOffer || acting) return;
        setActing(action);
        
        if (action === 'accept') {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/offers/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ offer_id: activeOffer.offer_id, operatorId: session?.user?.id }),
            });
            if (res.ok) {
                router.push(`/offers/${activeOffer.offer_id}`); // They will see the ✅ Accepted success card on that page!
                return;
            } else {
                alert('Offer could not be accepted. It may be expired or already taken by another operator.');
            }
        } else {
            await supabase.from('offers').update({ status: 'declined' }).eq('offer_id', activeOffer.offer_id);
        }
        
        // Remove from deck
        setOffers(prev => prev.slice(1));
        setActing(null);
    };

    if (!activeOffer) {
        return (
            <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center p-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h1 className="text-xl font-black mb-2">You're All Caught Up</h1>
                <p className="text-[#555] text-center text-sm mb-6">No more pending offers in this dispatch request.</p>
                <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-[#111] hover:bg-[#222] border border-[#222] transition-colors rounded-xl font-bold text-sm">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const { hc_loads: load, rate_offered } = activeOffer;
    const effectiveRate = rate_offered || activeOffer.offered_rate || 0;

    return (
        <div className="min-h-screen bg-[#070707] text-white p-4 flex flex-col pt-12 max-w-md mx-auto">
            {/* Header Data */}
            <div className="text-center mb-8">
                <div className="text-[10px] text-[#555] uppercase tracking-widest font-bold mb-2 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-[#F1A91B] rounded-full animate-pulse"></span>
                    Live Dispatch Request
                </div>
                <h1 className="text-2xl font-black">Incoming Load Offer</h1>
            </div>

            {/* Offer Card */}
            <div className="bg-[#0c0c0c] border border-[#1a1a1a] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex-1 max-h-[500px] flex flex-col">
                
                {/* Rate Highlight */}
                <div className="flex justify-between items-start mb-6 border-b border-[#1a1a1a] pb-4">
                    <div>
                        <div className="text-[#555] text-xs font-bold uppercase tracking-wider mb-1">Your Payout</div>
                        <div className="text-4xl font-black text-[#22c55e] tracking-tighter">
                            ${effectiveRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    {activeOffer.surge_percent > 0 && (
                        <div className="bg-[#f97316]/10 text-[#f97316] text-[10px] uppercase font-black tracking-wider px-2 py-1 rounded">
                            +{activeOffer.surge_percent}% Surge
                        </div>
                    )}
                </div>

                {/* Routing & Load Stats */}
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-[#666]">Load Profile</span>
                        <span className="font-bold">{load?.title || "Oversize Construction Material"}</span>
                    </div>

                    <div className="bg-[#111] p-4 rounded-xl border border-[#1a1a1a]">
                        <div className="flex items-center gap-3 mb-3">
                            <MapPin className="w-4 h-4 text-[#555]" />
                            <div className="font-semibold text-sm">{load?.origin_city || "Unknown"}</div>
                        </div>
                        <div className="pl-5 border-l-2 border-[#222] ml-1.5 py-1 flex items-center text-xs text-[#444] font-mono">
                            {load?.pickup_start ? new Date(load.pickup_start).toLocaleString() : 'ASAP'}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <Navigation2 className="w-4 h-4 text-[#F1A91B]" />
                            <div className="font-semibold text-sm">{load?.dest_city || "Unknown"}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {(load?.load_width || load?.load_height) && (
                            <div className="bg-[#111] p-3 rounded-xl border border-[#1a1a1a]">
                                <div className="text-xs text-[#555] mb-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Dimensions</div>
                                <div className="font-bold text-sm">{load?.load_width}ft W x {load?.load_height}ft H</div>
                            </div>
                        )}
                        {load?.urgency && (
                            <div className="bg-[#111] p-3 rounded-xl border border-[#1a1a1a]">
                                <div className="text-xs text-[#555] mb-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Priority</div>
                                <div className="font-bold text-sm uppercase text-[#F1A91B]">{load.urgency}</div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="mt-6 space-y-3 pb-8">
                <button
                    onClick={() => handleAction('accept')}
                    disabled={!!acting}
                    className="w-full h-14 bg-[#F1A91B] hover:bg-[#d4911a] text-black font-black text-lg rounded-xl flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(241,169,27,0.25)] active:scale-[0.98] disabled:opacity-50"
                >
                    {acting === 'accept' ? 'RESERVING...' : 'ACCEPT OFFER'} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                    onClick={() => handleAction('decline')}
                    disabled={!!acting}
                    className="w-full h-12 bg-transparent text-[#555] hover:text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-[#333] disabled:opacity-50"
                >
                    <Ban className="w-4 h-4" /> Pass on this load
                </button>
            </div>
        </div>
    );
}
