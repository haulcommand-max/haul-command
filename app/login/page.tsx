'use client';
import React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginGateway() {
    const supabase = createClientComponentClient();

    const handleSSO = async (provider: 'google' | 'discord') => {
        await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` }
        });
    };

    return (
        <main className="min-h-screen bg-gray-950 flex flex-col justify-center items-center text-white selection:bg-blue-500/30">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                <h1 className="text-4xl font-black uppercase tracking-tight text-white mb-2">AUTH SECURE</h1>
                <p className="text-gray-400 font-mono tracking-widest text-xs mb-8">Establish Node Connection to Haul Command.</p>

                <div className="space-y-4">
                    <button 
                        onClick={() => handleSSO('google')}
                        className="w-full border border-gray-700 bg-gray-950 hover:bg-gray-800 text-white p-4 font-bold uppercase tracking-widest text-sm transition-all focus:ring focus:ring-blue-500"
                    >
                        Authenticate via Google
                    </button>
                    <button 
                        onClick={() => handleSSO('discord')}
                        className="w-full border border-indigo-900/50 bg-indigo-950/20 hover:bg-indigo-900/40 text-indigo-400 p-4 font-bold uppercase tracking-widest text-sm transition-all"
                    >
                        Authenticate via Discord (Elite Net)
                    </button>
                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-gray-800"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-mono">OR EMAIL DEPLOYMENT</span>
                        <div className="flex-grow border-t border-gray-800"></div>
                    </div>
                </div>
                <p className="text-gray-500 text-xs text-center mt-6">
                    By confirming access, you submit to global MSB Settlement Terms.
                </p>
            </div>
        </main>
    );
}
