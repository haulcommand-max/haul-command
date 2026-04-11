import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/server-auth';

export const dynamic = 'force-dynamic';

export default async function PublicCareerCard({ params }: { params: { slug: string } }) {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: card } = await supabase
        .from('hc_training_career_cards')
        .select('*, profiles(display_name, trust_score, kyc_verified_at)')
        .eq('share_slug', params.slug)
        .single();

    if (!card) return <div className="p-10 bg-gray-950 text-red-500 font-black uppercase text-xl">Identity Dossier Not Found</div>;

    const isVerified = !!card.profiles?.kyc_verified_at;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-10 font-sans selection:bg-blue-500/30">
            <div className="max-w-3xl mx-auto border border-gray-800 bg-gray-900 p-8 md:p-12 shadow-2xl relative">
                {/* Visual Stamp */}
                <div className="absolute top-4 right-4 md:top-8 md:right-8 opacity-20 hover:opacity-80 transition-opacity">
                    <svg className="w-24 h-24 text-blue-500" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4"/>
                        <path d="M30 50 L45 65 L75 35" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>

                <div className="mb-8 border-b border-gray-800 pb-8">
                    <p className="text-gray-500 font-mono text-sm tracking-widest mb-2 uppercase">Official Haul Command ID Wrapper</p>
                    <h1 className="text-5xl font-black uppercase text-white tracking-tight">{card.profiles?.display_name || card.display_name}</h1>
                    
                    <div className="flex gap-4 mt-6">
                        {isVerified ? (
                            <span className="bg-blue-900/30 text-blue-400 border border-blue-800 px-4 py-2 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                ✅ KYC VERIFIED IDENTITY
                            </span>
                        ) : (
                            <span className="bg-gray-800 text-gray-500 border border-gray-700 px-4 py-2 font-bold uppercase tracking-widest text-xs">
                                ❌ UNVERIFIED ID
                            </span>
                        )}
                        <span className="bg-gray-800 text-white px-4 py-2 font-bold font-mono tracking-widest text-xs border border-gray-700">
                            TRUST SCORE: {card.profiles?.trust_score || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2">HC Identifier</h4>
                        <p className="font-mono text-xl text-gray-300">{card.hall_command_id}</p>
                    </div>
                    <div>
                        <h4 className="text-gray-500 uppercase tracking-widest text-sm font-bold mb-2">Training Authorized</h4>
                        <p className="font-mono text-xl text-blue-400">{card.training_hours} HOURS</p>
                    </div>
                </div>
                
                <div className="bg-blue-950/20 border border-blue-900/50 p-6">
                    <h3 className="text-blue-500 uppercase font-black tracking-widest mb-4">Elite Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                        {/* Mock mapping for now */}
                        <span className="bg-gray-900 border border-gray-700 px-3 py-1 font-mono text-xs text-gray-300">NIGHT ESCORT LEVEL 4</span>
                        <span className="bg-gray-900 border border-gray-700 px-3 py-1 font-mono text-xs text-gray-300">OVER-DIMENSIONAL CERTIFIED</span>
                        <span className="bg-gray-900 border border-gray-700 px-3 py-1 font-mono text-xs text-gray-300">MULTI-AXLE ROUTING</span>
                    </div>
                </div>
            </div>
            <p className="text-center text-gray-600 mt-10 text-xs font-mono uppercase tracking-widest">Provide this link to brokers for instant verification clearance.</p>
        </div>
    );
}
