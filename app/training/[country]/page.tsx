import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export default async function CountryTrainingOverlay({ params }: { params: { country: string } }) {
    const supabase = createServerComponentClient({ cookies });
    
    const { data: overlay } = await supabase.from('hc_training_country_overlays')
        .select('*')
        .eq('country_code', params.country.toUpperCase())
        .limit(1)
        .single();

    return (
        <div className="p-10 text-white bg-gray-950 min-h-screen">
            <h1 className="text-4xl font-black uppercase border-b border-gray-800 pb-4 mb-8">
                Compliance Operations in {params.country.toUpperCase()}
            </h1>
            
            {overlay ? (
                <div className="bg-blue-950/20 border border-blue-500/50 p-6">
                    <h3 className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2 font-mono">Enforcement Authority Context</h3>
                    <p className="text-white text-lg">{overlay.authority_name}</p>
                    <p className="text-gray-400 mt-4 text-sm">{JSON.stringify(overlay.requirements)}</p>
                </div>
            ) : (
                <div className="bg-gray-900 border border-yellow-600/50 p-6 text-center">
                    <p className="text-yellow-500 font-bold uppercase tracking-widest font-mono">No localized authority context mapped for this domain currently.</p>
                </div>
            )}
        </div>
    )
}
