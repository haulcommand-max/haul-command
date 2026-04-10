import React from 'react';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export default async function FirstJobJourney() {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    return (
        <div className="min-h-screen bg-gray-950 text-white p-10 font-sans">
            <h1 className="text-5xl font-black uppercase tracking-tight mb-6">14-Day Readiness Journey</h1>
            <p className="text-xl text-gray-400 mb-8 border-l-2 border-blue-500 pl-4">The exact protocol to build your compliance packet and secure your first operational dispatch.</p>
            
            <form action={async () => {
                'use server';
                if (!session?.user) redirect('/login');
                const supabaseServer = createServerComponentClient({ cookies });
                await supabaseServer.from('hc_training_profiles').upsert({
                    user_id: session.user.id,
                    accelerator_phase: 'First Job Journey',
                    availability_status: 'ACTIVE_TRAINING'
                });
                redirect('/training/report-card');
            }}>
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest uppercase px-8 py-4 w-full md:w-auto">
                    ACTIVATE JOURNEY MODULE
                </button>
            </form>
        </div>
    )
}
