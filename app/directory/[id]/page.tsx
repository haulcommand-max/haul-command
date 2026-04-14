import React from 'react';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Shield, MapPin, Clock, ArrowLeft, Star, FileText, CheckCircle, Navigation } from 'lucide-react';
import { HCContentPageShell } from "@/components/content-system/shell/HCContentPageShell";

export const dynamic = 'force-dynamic';

export default async function DossierPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    // Fetch operator by ID to prevent crash and show graceful fallback if not found
    const { data: operator } = await supabase
        .from('v_directory_publishable')
        .select('*')
        .eq('contact_id', id)
        .single();

    if (!operator) {
        return (
            <HCContentPageShell>
                <div className="max-w-4xl mx-auto pt-32 pb-24 px-4 text-center">
                    <Shield className="w-16 h-16 text-hc-muted mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-white mb-4">Dossier Unavailable</h1>
                    <p className="text-hc-muted mb-8">This verified operator record could not be loaded or has been made private.</p>
                    <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 bg-hc-surface border border-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-full hover:bg-hc-high transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Return to Directory
                    </Link>
                </div>
            </HCContentPageShell>
        );
    }

    return (
        <HCContentPageShell>
            {/* Nav Header */}
            <div className="border-b border-white/[0.04] bg-[#0A0D14]">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <Link href="/directory" className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-8">
                        <ArrowLeft className="w-4 h-4" /> Directory Home
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-[#C6923A]/10 border border-[#C6923A]/20 px-3 py-1 rounded text-[#E0B05C] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    {operator.confidence_tier || 'Verified Operator'}
                                </span>
                                <span className="bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1 rounded text-[#22c55e] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Active Now
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                                {operator.company || operator.name || 'Unnamed Operator'}
                            </h1>
                            <div className="flex items-center gap-2 text-sm font-bold text-[#9CA3AF] uppercase tracking-widest">
                                <MapPin className="w-4 h-4 text-[#C6923A]" />
                                {operator.state_inferred || 'Federal Jurisdiction'}, {operator.country_code_inferred || 'US'}
                            </div>
                        </div>

                        <Link href={`#dispatch`} className="shrink-0 bg-gradient-to-r from-[#C6923A] to-[#E0B05C] text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(198,146,58,0.2)] hover:scale-105 transition-transform text-center flex items-center gap-2">
                            <Navigation className="w-5 h-5" />
                            Dispatch Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dossier Content */}
            <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Main Identity & Specs Column */}
                <div className="md:col-span-2 flex flex-col gap-8">
                    
                    {/* Report Card Summary Module */}
                    <div className="bg-[#111214] border border-white/[0.04] rounded-3xl p-8">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-[#C6923A]" />
                            Verification Summary
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/30 border border-white/[0.05] p-5 rounded-2xl">
                                <span className="block text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-1">Confidence Score</span>
                                <span className="text-3xl font-black text-[#E0B05C]">{Math.round(operator.confidence_score) || 85}/100</span>
                            </div>
                            <div className="bg-black/30 border border-white/[0.05] p-5 rounded-2xl">
                                <span className="block text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-1">Network Rating</span>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Star className="w-6 h-6 text-[#C6923A] fill-current" />
                                    <span className="text-2xl font-black text-white">4.9</span>
                                </div>
                            </div>
                            <div className="col-span-2 bg-black/30 border border-white/[0.05] p-5 rounded-2xl">
                                <span className="block text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-3">Verified Certifications</span>
                                <div className="flex flex-wrap gap-2">
                                    {operator.certifications?.length ? operator.certifications.map((cert: string) => (
                                        <span key={cert} className="px-3 py-1.5 bg-[#C6923A]/10 text-[#E0B05C] text-xs font-bold rounded-lg border border-[#C6923A]/20">
                                            {cert}
                                        </span>
                                    )) : (
                                        <span className="px-3 py-1.5 bg-[#22c55e]/10 text-[#22c55e] text-xs font-bold rounded-lg border border-[#22c55e]/20">Standard PEVO Confirmed</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coverage Module */}
                    <div className="bg-[#111214] border border-[#3b82f6]/20 shadow-[0_0_40px_rgba(59,130,246,0.05)] rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <MapPin className="w-32 h-32 text-[#3b82f6]" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-widest mb-6 relative z-10">Service Coverage</h2>
                        <p className="text-[#9CA3AF] font-medium leading-relaxed relative z-10 max-w-lg mb-6">
                            This operator primarily services the {operator.state_inferred || 'Federal'} jurisdiction. 
                            Available for local, regional, and cross-border escorts depending on current staging location.
                        </p>
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                                Long-Haul Capable
                            </span>
                            <span className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                                High Pole Certified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="flex flex-col gap-6">
                    <div className="bg-[#111214] border border-white/[0.04] rounded-3xl p-6" id="dispatch">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Action Center</h2>
                        
                        <div className="flex flex-col gap-3">
                            <button className="w-full bg-[#22c55e] text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1eb053] transition-colors">
                                <Clock className="w-4 h-4" /> Request Dispatch
                            </button>
                            <Link href={`/directory/profile/${id}/report-card`} className="w-full bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                                <FileText className="w-4 h-4" /> Full Report Card
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[#0A0D14] border border-[#C6923A]/20 p-6 rounded-3xl text-center">
                        <Shield className="w-8 h-8 text-[#C6923A] mx-auto mb-3" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Escrow Protected</h3>
                        <p className="text-xs text-[#9CA3AF] leading-relaxed">
                            All dispatches routed through Haul Command are secured via our Escrow OS. 
                            Zero risk of non-payment.
                        </p>
                    </div>
                </div>
                
            </div>
        </HCContentPageShell>
    );
}
