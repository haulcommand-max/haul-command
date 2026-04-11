import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/server-auth';

export const dynamic = 'force-dynamic';

export default async function OperatorDashboard() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session?.user?.id).single();

    // The Progress Calculator Engine hook
    const progressLevel = profile?.compliance_level_percent || 0;

    return (
        <div className="min-h-screen bg-gray-950 text-white p-10 font-sans">
            <h1 className="text-4xl font-black uppercase text-white mb-2">Operator Action Station</h1>
            <p className="text-xl text-gray-400 mb-10 border-l-2 border-blue-500 pl-4">Manage document compliance and review active escrow deposits.</p>

            {/* Profile Completion Flow */}
            <div className="bg-gray-900 border border-gray-800 p-8 mb-10 w-full shadow-2xl relative overflow-hidden">
                 <div className="absolute right-0 top-0 h-full w-2 bg-gray-800">
                    <div className="w-full bg-blue-500 transition-all duration-1000" style={{ height: `${progressLevel}%` }}></div>
                 </div>
                 
                 <h2 className="text-lg font-bold uppercase tracking-widest text-blue-500 mb-4">Compliance Integrity</h2>
                 <div className="flex items-center gap-4 mb-4">
                     <div className="w-full h-4 bg-gray-800 overflow-hidden relative">
                         <div className="h-full bg-blue-500 absolute left-0 top-0 transition-all duration-1000" style={{ width: `${progressLevel}%` }}></div>
                     </div>
                     <span className="font-mono text-xl font-bold text-white">{progressLevel}%</span>
                 </div>
                 <p className="text-gray-400 text-sm">Brokers will not deploy escrows below 100% compliance threshold.</p>
                 <button className="mt-4 border border-blue-500 bg-transparent hover:bg-blue-600 text-blue-400 hover:text-white px-6 py-3 font-bold uppercase tracking-widest text-xs transition-colors">
                     Trigger Analysis Diagnostics
                 </button>
            </div>

            {/* Sub-Systems: Document Vault */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-900 border border-gray-800 p-8">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6">Encrypted Document Vault</h3>
                    
                    <form className="space-y-4" action={async (formData) => {
                        'use server';
                        // In prod, intercept file data here then push via supabase storage-js directly from client for performance
                        // this is the server hook representation.
                        console.log("SERVER ACTION: Vault file received.");
                    }}>
                        <div className="border border-dashed border-gray-700 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-950">
                            <p className="text-sm font-mono text-gray-400 uppercase tracking-widest">Select Certificate of Insurance (PDF)</p>
                            <input type="file" className="hidden" />
                        </div>
                        <button className="w-full bg-blue-600 hover:bg-blue-500 px-6 py-4 font-bold uppercase tracking-widest text-xs text-white">
                            UPLOAD TO VAULT
                        </button>
                    </form>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-8">
                    <h3 className="text-lg font-bold uppercase tracking-widest mb-6 text-gray-400">Recent Executed Escrows</h3>
                    <div className="flex flex-col justify-center items-center h-48 border border-gray-800 bg-gray-950/50">
                        <span className="text-gray-600 font-mono uppercase tracking-widest text-xs mb-2">NO ACTIVE SETTLEMENTS</span>
                        <a href="/load-board" className="text-blue-500 hover:text-blue-400 uppercase text-xs font-bold tracking-widest underline underline-offset-4">Browse Load Board</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
