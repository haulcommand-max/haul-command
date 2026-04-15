import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LoadBoard() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    
    // Fetch live loads with escrow context mapped via Priority 1 settlement logic
    const { data: loads, error } = await supabase
        .from('jobs')
        .select('*, profiles:posted_by(display_name, trust_score), hc_escrows(status)')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <main className=" bg-transparent text-white p-10 font-sans selection:bg-blue-500/30">
            <header className="mb-10 max-w-7xl mx-auto border-b border-gray-900 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black uppercase text-white tracking-tighter">Heavy Haul Load Board</h1>
                    <p className="text-gray-400 font-mono tracking-widest mt-2 uppercase text-sm">
                        <span className="text-blue-500 mr-2">LIVE</span> [ US Coverage Active ]
                    </p>
                </div>
                <Link href="/dashboard/broker/new-load" className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase text-xs px-6 py-3 transition-colors">
                    + Deploy Load Vector
                </Link>
            </header>

            <div className="max-w-7xl mx-auto grid gap-4">
                {loads && loads.length > 0 ? loads.map((load: any) => {
                    // AdGrid Sponsorship / Trust UI Logic
                    const isVerifiedEscrow = load.hc_escrows && load.hc_escrows.some((e: any) => e.status === 'ESCROW_LOCKED');
                    const trustScore = load.profiles?.trust_score || 'N/A';
                    
                    return (
                        <div key={load.id} className="bg-gray-900 border border-gray-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-gray-600 transition-colors group">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-bold uppercase tracking-tight">{load.origin_city} <span className="text-gray-500 mx-2">â†’</span> {load.destination_city}</h3>
                                    {isVerifiedEscrow && (
                                        <span className="bg-green-900/30 text-green-400 border border-green-800 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                                            âœ… VERIFIED FUNDS
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 font-mono text-sm max-w-2xl">{load.description || "Oversize payload requiring specialized escort routing."}</p>
                                <div className="mt-4 flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Broker: <span className="text-gray-300">{load.profiles?.display_name || 'Unknown'}</span></span>
                                    <span>Broker Trust: <span className={trustScore > 8 ? "text-blue-400" : "text-yellow-500"}>{trustScore} / 10</span></span>
                                    <span>Budget: <span className="text-green-500">${load.budget_amount || 'RFQ'}</span></span>
                                </div>
                            </div>
                            
                            <div className="mt-6 md:mt-0 ml-0 md:ml-6 shrink-0">
                                <Link href={`/load-board/${load.id}`} className="bg-transparent border border-blue-600/50 text-blue-400 hover:bg-blue-600 hover:text-white transition-all px-8 py-4 uppercase font-bold tracking-widest text-sm text-center block">
                                    Inspect Vector
                                </Link>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="border border-[#C6923A]/20 bg-[#C6923A]/[0.04] p-12 rounded-lg text-center backdrop-blur-sm">
                        <h4 className="text-xl font-bold uppercase tracking-widest text-[#C6923A] mb-3">No Active Loads</h4>
                        <p className="text-gray-400 max-w-lg mx-auto mb-8">The load board is ready for your first posting. Post an oversize or heavy haul load to get matched with verified escort operators.</p>
                        <Link href="/dashboard/broker/new-load" className="inline-flex items-center gap-2 bg-[#C6923A] hover:bg-[#D4A348] text-black font-bold tracking-widest uppercase text-xs px-8 py-4 rounded-lg transition-colors">
                            + Post Your First Load
                        </Link>
                    </div>
                )}
            </div>
        </main>
    )
}