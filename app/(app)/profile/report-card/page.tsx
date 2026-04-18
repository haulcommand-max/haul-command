import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReportCard() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    
    // Retrieve Auth User
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    // Fallback if not authenticated
    if (!user) {
        return (
            <div className="p-10 text-white bg-gray-950 flex flex-col justify-center items-center h-screen border-t border-gray-900">
                <h1 className="text-3xl font-black text-red-500 mb-4">ACCESS DENIED // NOT LOGGED IN</h1>
                <p className="text-gray-400">You must be authenticated to view your active career card.</p>
                <Link href="/login" className="mt-6 bg-blue-600 px-6 py-3 font-bold uppercase tracking-widest text-sm hover:bg-blue-500 transition-colors">
                    Login via SSO
                </Link>
            </div>
        );
    }

    // Fetch the real report card data
    const { data: reportCard } = await supabase
        .from('hc_training_report_cards')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
    // Fetch diagnostics / gap analysis
    const { data: diagnostics } = await supabase
        .from('hc_training_diagnostics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div className="p-10 text-white bg-transparent ">
            <h1 className="text-4xl font-bold uppercase tracking-tighter shadow-sm text-gray-100">Career & Report Card</h1>
            <p className="text-gray-400 font-mono text-sm tracking-widest mt-2 border-l-2 border-blue-500 pl-4 py-1">
                OPERATOR ID: {user.id.split('-')[0].toUpperCase()}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
                <div className="p-6 bg-gray-900 rounded-none border border-gray-800 border-l-4 border-l-blue-500 shadow-xl relative overflow-hidden group hover:bg-gray-800/80 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20"></div>
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-2">Trust Score</p>
                    <h2 className="text-4xl font-black text-white">{reportCard?.trust_score?.toFixed(1) || '0.0'} <span className="text-lg text-gray-500 font-light">/ 10</span></h2>
                </div>
                
                <div className="p-6 bg-gray-900 rounded-none border border-gray-800 border-l-4 border-l-green-500 shadow-xl relative overflow-hidden group hover:bg-gray-800/80 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 blur-2xl group-hover:bg-green-500/20"></div>
                    <p className="text-xs text-green-500 font-bold uppercase tracking-widest mb-2">Readiness</p>
                    <h2 className="text-4xl font-black text-white">{reportCard?.readiness_score || '0'}%</h2>
                </div>
                
                <div className="p-6 bg-gray-900 rounded-none border border-gray-800 shadow-xl relative overflow-hidden">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Training Completed</p>
                    <h2 className="text-4xl font-black text-white">{reportCard?.training_completion_percent || '0'}%</h2>
                </div>
                
                <div className="p-6 bg-gray-900 rounded-none border border-gray-800 shadow-xl relative overflow-hidden">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Current Rank</p>
                    <h2 className="text-4xl font-black text-blue-400 capitalize">{reportCard?.current_rank_slug?.replace(/-/g, ' ') || 'New Entrant'}</h2>
                </div>
            </div>
            
            <section className="mt-16">
                <h3 className="text-2xl font-black uppercase text-red-500 tracking-tight flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Diagnostics Analysis 
                    <span className="text-sm font-light text-gray-500 tracking-normal capitalize ml-2">Why you didn't get picked recently</span>
                </h3>
                
                {diagnostics && diagnostics.length > 0 ? (
                    <div className="space-y-4 mt-6">
                        {diagnostics.map((diag, i) => (
                            <div key={i} className="bg-gray-900 border border-red-900/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-red-500/30 transition-colors">
                                <div>
                                    <p className="font-bold text-white text-lg tracking-tight">{diag.likely_reason}</p>
                                    <p className="text-sm text-gray-400 font-light mt-1">Opportunity Vector: <span className="font-mono text-gray-500">{diag.opportunity_ref}</span></p>
                                    <p className="text-sm text-gray-400 font-light mt-2 border-l border-gray-700 pl-3">Recommended Fix: {diag.recommended_fix}</p>
                                </div>
                                {diag.linked_module_slug && (
                                    <Link href={`/training/core/${diag.linked_module_slug!}`} className="bg-transparent px-6 py-3 border border-blue-500 text-blue-400 font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all text-xs whitespace-nowrap">
                                        Deploy Protocol Patch
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-green-950/20 border border-green-900/50 p-8 mt-6 flex items-center justify-center">
                        <p className="text-green-500 font-bold tracking-widest font-mono uppercase text-sm">No Fatal Disconnects Found. Operations Nominal.</p>
                    </div>
                )}
            </section>
        </div>
    )
}