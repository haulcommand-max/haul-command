import React from 'react';
import Link from 'next/link';

export default function TrainingHub() {
    return (
        <main className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30 font-sans">
            {/* HERO SECTION — PAGE FAMILY: DARK_OPS */}
            <section className="relative w-full h-[70vh] flex items-center bg-gray-950 overflow-hidden border-b border-gray-900">
                {/* Visual Taxonomy: DARK_OPS Map Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-[url('/assets/dark_ops_hero.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent z-10"></div>
                </div>

                <div className="relative z-20 max-w-7xl mx-auto px-6 w-full mt-10">
                    <div className="uppercase tracking-[0.2em] text-blue-500 font-bold text-sm mb-4">
                        System Online // Haul Command Network
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight leading-none text-white drop-shadow-2xl">
                        THE GLOBAL <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
                            COMPLIANCE OS.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl font-light mb-10 border-l-2 border-blue-500 pl-4 py-2">
                        The definitive 18-month path from new entrant to high-level superload operator. Get ready, get verified, get paid.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md cursor-pointer">
                        <Link href="/training/report-card" className="flex-1 bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] text-white px-8 py-4 font-bold rounded-none uppercase text-sm tracking-widest transition-all text-center">
                            Start 14-Day Readiness
                        </Link>
                        <Link href="/compliance-kit" className="flex-1 bg-transparent hover:bg-gray-900 text-white border border-gray-700 hover:border-gray-500 px-8 py-4 font-bold rounded-none uppercase text-sm tracking-widest transition-all text-center">
                            Map Local Authority
                        </Link>
                    </div>
                </div>
            </section>
            
            {/* THE TRACKS — PAGE FAMILY: COMPLIANCE_WHITE ACCENTS */}
            <section className="relative z-20 max-w-7xl mx-auto px-6 -mt-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Track 1 */}
                    <div className="group bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 hover:border-blue-500/50 transition-colors shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="text-blue-500 font-mono text-xs mb-4">PHASE 01 // ONBOARDING</div>
                        <h3 className="text-2xl font-black uppercase mb-3 text-white">First Job Journey</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            A 14-day intensive protocol to activate availability, build a broker-ready compliance packet, and master the entry path.
                        </p>
                        <Link href="/training/first-job" className="text-blue-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 group-hover:text-blue-300">
                            Deploy Track <span className="text-lg">→</span>
                        </Link>
                    </div>

                    {/* Track 2 */}
                    <div className="group bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 hover:border-indigo-500/50 transition-colors shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                        <div className="text-indigo-500 font-mono text-xs mb-4">PHASE 02 // SCALE</div>
                        <h3 className="text-2xl font-black uppercase mb-3 text-white">18-Month Accelerator</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Elevate your Trust Score. Unlock badges, advanced specializations, and premium market load placements over time.
                        </p>
                        <Link href="/training/accelerator" className="text-indigo-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 group-hover:text-indigo-300">
                            Deploy Track <span className="text-lg">→</span>
                        </Link>
                    </div>

                    {/* Track 3 */}
                    <div className="group bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 hover:border-red-500/50 transition-colors shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                        <div className="text-red-500 font-mono text-xs mb-4">PHASE 03 // ELITE</div>
                        <h3 className="text-2xl font-black uppercase mb-3 text-white">Premium Elite Network</h3>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Master route surveying, payload dynamics, and multi-state escort command. Fully verified on your immutable ID.
                        </p>
                        <Link href="/training/elite" className="text-red-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 group-hover:text-red-300">
                            Deploy Track <span className="text-lg">→</span>
                        </Link>
                    </div>
                </div>
            </section>
            
            {/* STATS SECTION */}
            <section className="py-32 max-w-7xl mx-auto px-6 grid border-b border-gray-900">
                <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-black uppercase text-white mb-6 leading-tight">
                            The Cost of Ignorance is <span className="text-red-500">Unsettled Escrows.</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Haul Command isn't a school; it's a Settlement OS. Unverified operators are screened out immediately. Our automated diagnostic engines identify exactly why you lost the bid, train you on the gap, and re-insert you into the active flow.
                        </p>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-900 border border-gray-800 text-center">
                            <h4 className="text-4xl font-black text-white">120</h4>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Nations Mapped</p>
                        </div>
                        <div className="p-6 bg-gray-900 border border-gray-800 text-center">
                            <h4 className="text-4xl font-black text-white">100%</h4>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Dispute Protected</p>
                        </div>
                        <div className="p-6 bg-gray-900 border border-red-900/30 text-center">
                            <h4 className="text-4xl font-black text-red-500">3.4x</h4>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Higher Close Rate</p>
                        </div>
                        <div className="p-6 bg-gray-900 border border-blue-900/30 text-center">
                            <h4 className="text-4xl font-black text-blue-500">20m</h4>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Avg Escrow Lock</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
