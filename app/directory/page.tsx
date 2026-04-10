import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function GlobalDirectory({ searchParams }: { searchParams: { country?: string } }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = searchParams.country || 'US';

    // Global 120-Country Sync: Sorting active providers by TRUST SCORE first automatically.
    const { data: providers } = await supabase
        .from('profiles')
        .select('*, hc_training_profiles(*)')
        .eq('role', 'pilot_car') // Assuming role is operator
        .order('trust_score', { ascending: false })
        .limit(50);

    return (
        <main className="min-h-screen bg-gray-950 text-white p-10 font-sans selection:bg-blue-500/30">
            <header className="mb-10 max-w-7xl mx-auto border-b border-gray-900 pb-6">
                <h1 className="text-5xl font-black uppercase text-white tracking-tighter">Global Force Directory</h1>
                <p className="text-gray-400 font-mono tracking-widest mt-2 uppercase text-sm flex gap-4 mt-4">
                    <Link href="/directory?country=US" className={targetCountry === 'US' ? "text-blue-500" : "hover:text-blue-400"}>ISO: USA</Link>
                    <Link href="/directory?country=CA" className={targetCountry === 'CA' ? "text-blue-500" : "hover:text-blue-400"}>ISO: CAN</Link>
                    <Link href="/directory?country=AU" className={targetCountry === 'AU' ? "text-blue-500" : "hover:text-blue-400"}>ISO: AUS</Link>
                </p>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {providers && providers.length > 0 ? providers.map((p: any) => (
                    <div key={p.id} className="bg-gray-900 border border-gray-800 p-6 flex flex-col justify-between hover:border-gray-600 transition-colors relative overflow-hidden group">
                        {p.trust_score > 9 && <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl"></div>}
                        
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold uppercase truncate">{p.display_name || 'Verified Operator'}</h3>
                                <span className="bg-gray-950 border border-gray-800 px-2 py-1 text-xs font-mono text-gray-400">
                                    R: {p.trust_score || 'N/A'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 space-y-2 mb-6">
                                <p><strong>ISO Domain:</strong> {targetCountry}</p>
                                <p><strong>Readiness:</strong> {p.hc_training_profiles?.[0]?.active_market_codes ? 'Multi-State' : 'Standard'}</p>
                            </div>
                        </div>

                        <Link href={`/directory/${p.id}`} className="bg-gray-800 hover:bg-gray-700 text-white font-bold uppercase tracking-widest text-xs py-3 text-center transition-all w-full border border-gray-700">
                            View Dossier
                        </Link>
                    </div>
                )) : (
                    <div className="col-span-full p-16 border border-gray-800 text-center bg-gray-900/50">
                        <p className="text-gray-500 font-mono tracking-widest uppercase">No Operators Found in this Operations Sector.</p>
                    </div>
                )}
            </div>
        </main>
    )
}
