import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, Zap, ShieldCheck, Map, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How Haul Command Works | The 15X Logistics Engine',
    description: 'Stop waiting for quotes. See how Haul Command uses algorithmic dispatch, instant trust verification, and live hazard intel to match you with top-rated escort operators instantly.',
};

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Outdated Directories vs Algorithms</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-6 leading-[0.9]">
                        STOP WAITING FOR QUOTES.<br />
                        <span className="text-amber-500 underline decoration-8 underline-offset-8">START DISPATCHING.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                        Old pilot car directories make you fill out a form, wait hours for quotes, and pray the operator is compliant. Haul Command is an intelligence engine that dispatches the closest verified operator in milliseconds.
                    </p>
                    
                    <Link href="/loads/new" className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-lg tracking-wide uppercase rounded-xl transition-all group shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
                        Dispatch a Load Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* The 15X Comparison */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* The Old Way */}
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 opacity-80">
                            <h3 className="text-xl font-black text-gray-400 mb-6 uppercase tracking-widest">The Old Way <br/><span className="text-sm font-medium text-red-400">Basic Lead Gen</span></h3>
                            <ul className="space-y-6">
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-red-500 font-bold">1</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Static Text Rules</h4>
                                        <p className="text-sm text-gray-400">Read through paragraphs of state laws hoping you understood the dimensions properly.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-red-500 font-bold">2</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Blind Quoting</h4>
                                        <p className="text-sm text-gray-400">Fill out a generic form. Receive wildly random rates 4 hours later. Overpay.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-red-500 font-bold">3</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Unverified "Trust"</h4>
                                        <p className="text-sm text-gray-400">No insight into if they are actually certified, insured, or competent.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* The Haul Command Way */}
                        <div className="bg-amber-500/5 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-amber-500/10">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 blur-[50px]"></div>
                            
                            <h3 className="text-xl font-black text-amber-500 mb-6 uppercase tracking-widest">Haul Command <br/><span className="text-sm font-medium text-white">Algorithmic OS</span></h3>
                            <ul className="space-y-6 relative z-10">
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">AI Compliance Copilot</h4>
                                        <p className="text-sm text-amber-500/70">Type in your dimensions. The engine instantly maps state laws, flags high poles, and configs escorts.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Live Match Dispatch</h4>
                                        <p className="text-sm text-amber-500/70">Push the load. Pre-auth the live median rate. Escorts in a 50-mile radius are pinged. Matched in 3 mins.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Algorithmic Trust Scores</h4>
                                        <p className="text-sm text-amber-500/70">Drivers are tracked. We verify their insurance, FMCSA records, and measure their GPS clean-run percentages.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visual System Tour */}
            <section className="py-20 bg-black">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-4">THE OPERATING SYSTEM</h2>
                        <p className="text-gray-400 max-w-xl mx-auto">Connecting realtime intelligence with physical logistics.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Feature Blocks */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
                                <Map className="w-8 h-8 text-amber-500 mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">Crowdsourced Hazard Intel</h4>
                                <p className="text-gray-400 text-sm">Why pay $999 for a static route survey? Haul Command aggregates live driver reports on choke points, low bridges, and scales directly into your route map.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
                                <Zap className="w-8 h-8 text-amber-500 mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">Live Rate Index</h4>
                                <p className="text-gray-400 text-sm">See exactly what the market is paying (P25/P50/P75). Eliminate negotiation friction by clearing loads at the true median price.</p>
                            </div>
                        </div>

                        {/* Visual representation */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/e0/Topographic_map_example.png')] bg-cover mix-blend-luminosity"></div>
                            
                            {/* Mock UI */}
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-5 w-full max-w-sm relative z-10 shadow-2xl">
                                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                                    <div className="font-bold text-white text-sm">MATCH FOUND</div>
                                    <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase">En Route</div>
                                </div>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black font-black text-xl">L</div>
                                    <div>
                                        <div className="text-white font-bold">Lone Star Pilot Cars</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            <span>ETA: 14 mins</span>
                                            <span>•</span>
                                            <span className="text-amber-500">Trust: 96%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-500 hover:bg-amber-400 cursor-pointer text-black text-center font-black py-3 rounded-lg text-sm transition-colors">
                                    TRACK LIVE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
