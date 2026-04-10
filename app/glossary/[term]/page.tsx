import React from 'react';
import Link from 'next/link';

export default function GlossaryTerm({ params }: { params: { term: string } }) {
    const rawTerm = params.term.replace(/-/g, ' ');
    
    return (
        <main className="min-h-screen bg-gray-950 text-white p-10 font-sans selection:bg-blue-500/30">
            <article className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <p className="text-blue-500 font-mono text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 animate-pulse"></span> Haul Command Deep Glossary
                    </p>
                    <h1 className="text-6xl font-black uppercase text-white tracking-tighter">{rawTerm}</h1>
                </header>

                <div className="bg-gray-900 p-8 border border-gray-800 mb-8 border-l-4 border-l-blue-500">
                    <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Lexicon Core Definition</h3>
                    <p className="text-2xl font-light text-white leading-relaxed">
                        The highly specialized metric defining the boundary of action on heavy haul routes, heavily scrutinized by regulatory authorities across 120 global operating states.
                    </p>
                </div>
                
                <div className="flex bg-gray-900 border border-gray-800 p-6">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest text-sm">Actionable Intelligence</h4>
                        <p className="text-gray-400 text-sm mt-2">See how to master this concept in the field.</p>
                    </div>
                    <Link href={`/training/core/${params.term}`} className="bg-gray-800 hover:bg-gray-700 font-mono text-blue-400 uppercase font-bold px-6 py-4 border border-gray-600 transition-colors shrink-0">
                        OPEN LESSON PROTOCOL
                    </Link>
                </div>
            </article>
        </main>
    )
}
