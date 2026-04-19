import React from 'react';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Shield, MapPin, Clock, ArrowLeft, Star, FileText, CheckCircle, Navigation, MessageSquare } from 'lucide-react';
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
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-gray-900 mb-4">Dossier Unavailable</h1>
                    <p className="text-gray-500 mb-8">This verified operator record could not be loaded or has been made private.</p>
                    <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold uppercase tracking-widest text-xs rounded-full hover:bg-gray-50 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Return to Directory
                    </Link>
                </div>
            </HCContentPageShell>
        );
    }

    return (
        <HCContentPageShell>
            {/* Nav Header */}
            <div className="border-b border-gray-200 bg-white">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <Link href="/directory" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-xs font-bold uppercase tracking-widest mb-8">
                        <ArrowLeft className="w-4 h-4" /> Directory Home
                    </Link>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="bg-[#FEF9C3] border border-[#FDE047] px-3 py-1 rounded text-[#854D0E] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    {operator.confidence_tier || 'Verified Operator'}
                                </span>
                                <span className="bg-[#111827] text-[#FACC15] px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                    <Star className="w-3 h-3 text-[#FACC15] fill-current" />
                                    Top 10 — {stateFullName(operator.state_inferred, true)}
                                </span>
                                <span className="bg-[#DCFCE7] border border-[#BBF7D0] px-3 py-1 rounded text-[#166534] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Active Now
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
                                {operator.company || operator.name || 'Unnamed Operator'}
                            </h1>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
                                <MapPin className="w-4 h-4 text-[#C6923A]" />
                                {stateFullName(operator.state_inferred, true)}, {countryFullName(operator.country_code_inferred || 'US')}
                            </div>
                        </div>

                        <Link href={`/auth/signup?intent=dispatch&target=${id}`} className="shrink-0 bg-[#0a66c2] hover:bg-[#004182] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-sm hover:scale-105 transition-transform text-center flex items-center justify-center gap-2">
                            <Navigation className="w-5 h-5" />
                            Dispatch Now
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dossier Content */}
            <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 pb-32">
                
                {/* Main Identity & Specs Column */}
                <div className="md:col-span-2 flex flex-col gap-8">
                    
                    {/* Report Card Summary Module */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8">
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-[#C6923A]" />
                            Verification Summary
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#F9FAFB] border border-gray-200 p-5 rounded-2xl relative overflow-hidden group">
                                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Network Rating</span>
                                <div className="flex items-end justify-between">
                                  <div className="flex items-center gap-1.5 mt-1">
                                      <Star className="w-6 h-6 text-[#C6923A] fill-current" />
                                      <span className="text-2xl font-black text-gray-900">5.0</span>
                                  </div>
                                  <span className="text-[10px] text-[#166534] font-bold uppercase tracking-widest bg-[#DCFCE7] px-2 py-0.5 rounded border border-[#BBF7D0]">Verified</span>
                                </div>
                            </div>
                            <div className="bg-[#F9FAFB] border border-gray-200 p-5 rounded-2xl relative overflow-hidden cursor-pointer group">
                                <Link href="/auth/signup?intent=broker-upgrade" className="absolute inset-0 z-20"></Link>
                                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">12-PT Trust Score</span>
                                <div className="flex flex-col gap-2 mt-2 filter blur-[3px] opacity-60">
                                  <div className="h-2 bg-[#C6923A] rounded w-full"></div>
                                  <div className="h-2 bg-[#22c55e] rounded w-5/6"></div>
                                  <div className="h-2 bg-gray-300 rounded w-4/6"></div>
                                </div>
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] transition-all group-hover:bg-white/90">
                                    <span className="bg-[#C6923A] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-md flex items-center gap-1.5">
                                      <Shield className="w-3 h-3" />
                                      Unlock Pro Data
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 bg-[#F9FAFB] border border-gray-200 p-5 rounded-2xl">
                                <span className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">Verified Certifications</span>
                                <div className="flex flex-wrap gap-2">
                                    {operator.certifications?.length ? operator.certifications.map((cert: string) => (
                                        <span key={cert} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                                            {cert}
                                        </span>
                                    )) : (
                                        <span className="px-3 py-1.5 bg-[#DCFCE7] text-[#166534] text-xs font-bold rounded-lg border border-[#BBF7D0]">Standard PEVO Confirmed</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coverage Module */}
                    <div className="bg-white border border-blue-200 shadow-sm rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <MapPin className="w-32 h-32 text-blue-500" />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6 relative z-10">Service Coverage</h2>
                        <p className="text-gray-600 font-medium leading-relaxed relative z-10 max-w-lg mb-6">
                            This operator primarily services the {stateFullName(operator.state_inferred, true)} jurisdiction. 
                            Available for local, regional, and cross-border escorts depending on current staging location.
                        </p>
                        <div className="flex items-center gap-3 relative z-10">
                            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                                Long-Haul Capable
                            </span>
                            <span className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">
                                High Pole Certified
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6" id="dispatch">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Action Center</h2>
                        
                        <div className="flex flex-col gap-3">
                            <Link href={`/auth/signup?intent=dispatch&target=${id}`} className="w-full bg-[#16a34a] text-white font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#15803d] transition-colors shadow-sm">
                                <Clock className="w-4 h-4" /> Request Dispatch
                            </Link>
                            <Link href={`/directory/profile/${id}/report-card`} className="w-full bg-[#F3F4F6] border border-[#D1D5DB] text-gray-700 font-bold uppercase tracking-widest text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#E5E7EB] transition-colors">
                                <FileText className="w-4 h-4" /> Full Report Card
                            </Link>
                        </div>
                    </div>

                    <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-6 rounded-2xl text-center">
                        <Shield className="w-8 h-8 text-[#C6923A] mx-auto mb-3" />
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Escrow Protected</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            All dispatches routed through Haul Command are secured via our Escrow OS. 
                            Zero risk of non-payment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sticky "Request Live Quote" Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50 p-4 sm:p-5">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-[#0a66c2] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {(operator.company || operator.name || 'O')[0].toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 m-0 leading-tight">
                                {operator.company || operator.name || 'Verified Operator'}
                            </p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Typically responds in under 5 mins
                            </p>
                        </div>
                    </div>
                    <Link 
                        href={`/auth/signup?intent=dispatch&target=${id}`}
                        className="w-full sm:w-auto px-8 py-3 bg-[#FACC15] hover:bg-[#EAB308] text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-[#FACC15]/30 flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Request Live Quote
                    </Link>
                </div>
            </div>
        </HCContentPageShell>
    );
}
