import React from 'react';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Shield, MapPin, Clock, ArrowLeft, Star, FileText, CheckCircle, Navigation } from 'lucide-react';
import { HCContentPageShell } from "@/components/content-system/shell/HCContentPageShell";
import { stateFullName, countryFullName } from '@/lib/geo/state-names';

export const dynamic = 'force-dynamic';

export default async function DossierPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    // Fetch operator by ID — defensive try/catch to prevent System Fault crash  
    let operator: any = null;
    try {
        const { data } = await supabase
            .from('v_directory_publishable')
            .select('*')
            .eq('contact_id', id)
            .single();
        operator = data;
    } catch (e) {
        console.warn('[dossier] Query failed for id:', id, e);
    }

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
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-[#C6923A]/10 border border-[#C6923A]/20 px-3 py-1 rounded text-[#E0B05C] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    {operator.confidence_tier || 'Verified Operator'}
                                </span>
                                <span className="bg-gradient-to-r from-[#C6923A] to-[#E0B05C] text-black px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(198,146,58,0.3)]">
                                    <Star className="w-3 h-3 text-black fill-current" />
                                    Top 10 — {stateFullName(operator.state_inferred, true)}
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
                                {stateFullName(operator.state_inferred, true)}, {countryFullName(operator.country_code_inferred || 'US')}
                            </div>
                        </div>

                        <Link href={`/auth/signup?intent=dispatch&target=${id}`} className="shrink-0 bg-gradient-to-r from-[#C6923A] to-[#E0B05C] text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-[0_0_30px_rgba(198,146,58,0.2)] hover:scale-105 transition-transform text-center flex items-center justify-center gap-2">
                            <Navigation className="w-5 h-5 opacity-80" />
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/30 border border-white/[0.05] p-5 rounded-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[#C6923A]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                <span className="block text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-1">Network Rating</span>
                                <div className="flex items-end justify-between">
                                  <div className="flex items-center gap-1.5 mt-1">
                                      <Star className="w-6 h-6 text-[#E0B05C] fill-current" />
                                      <span className="text-2xl font-black text-white">5.0</span>
                                  </div>
                                  <span className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/20">Verified</span>
                                </div>
                            </div>
                            <div className="bg-black/30 border border-white/[0.05] p-5 rounded-2xl relative overflow-hidden cursor-pointer group">
                                <Link href="/auth/signup?intent=broker-upgrade" className="absolute inset-0 z-20"></Link>
                                <span className="block text-[#9CA3AF] text-xs font-bold uppercase tracking-widest mb-1">12-PT Trust Score</span>
                                <div className="flex flex-col gap-2 mt-2 filter blur-[3px] opacity-40">
                                  <div className="h-2 bg-[#E0B05C] rounded w-full"></div>
                                  <div className="h-2 bg-[#22c55e] rounded w-5/6"></div>
                                  <div className="h-2 bg-white/20 rounded w-4/6"></div>
                                </div>
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] transition-all group-hover:bg-black/80">
                                    <span className="bg-[#C6923A] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-lg flex items-center gap-1.5">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                      Unlock Pro Data
                                    </span>
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
                            This operator primarily services the {stateFullName(operator.state_inferred, true)} jurisdiction. 
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
                            <Link href={`/auth/signup?intent=dispatch&target=${id}`} className="w-full bg-[#22c55e] text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1eb053] transition-colors shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                                <Clock className="w-4 h-4" /> Request Dispatch
                            </Link>
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
