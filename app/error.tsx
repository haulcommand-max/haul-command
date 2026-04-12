'use client';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an observability layer
        console.error("Haul Command Error Boundary Triggered:", error);
    }, [error]);

    return (
        <main className="min-h-screen bg-transparent flex flex-col justify-center items-center text-white selection:bg-blue-500/30 p-10">
            <div className="max-w-md w-full bg-gray-900 border border-red-900 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2 text-red-500">SYSTEM FAULT</h1>
                <p className="text-gray-400 font-mono tracking-widest text-xs mb-8">Navigation Vector Compromised.</p>

                <div className="bg-red-950/20 p-4 border border-red-900/50 mb-6">
                    <p className="font-mono text-xs text-red-300">{error.message || "An unexpected anomaly occurred within the routing sequence."}</p>
                </div>

                <button 
                    onClick={() => reset()}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest uppercase px-6 py-4 transition-colors"
                >
                    INITIATE RESTART SEQUENCE
                </button>
            </div>
        </main>
    );
}
