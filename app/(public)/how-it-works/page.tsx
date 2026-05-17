import { Metadata } from 'next';
import Link from 'next/link';
import { Bot, Zap, ShieldCheck, Map, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How Haul Command Works | Heavy Haul Support Workflow',
    description: 'See how Haul Command helps brokers and operators post requests, compare source-backed records, review trust signals, and build support packets without inventing supply.',
};

export default function HowItWorksPage() {
    return (
        <div className=" bg-[#0a0a0f] text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-5 mix-blend-overlay"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Directories vs source-backed workflows</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mb-6 leading-[0.9]">
                        STOP CHASING STALE LISTS.<br />
                        <span className="text-amber-500 underline decoration-8 underline-offset-8">BUILD A SUPPORT PACKET.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                        Old pilot car directories make you fill out a form and hope the listing is current. Haul Command helps you post the route, compare source-backed records, and review claim and freshness signals before dispatch.
                    </p>
                    
                    <Link href="/loads/new" className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black text-lg tracking-wide uppercase rounded-xl transition-all group shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]">
                        Post a Support Request
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
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">AI Compliance Copilot</h4>
                                        <p className="text-sm text-amber-500/70">Enter dimensions and route context. The system surfaces rules, high-pole considerations, and next actions where data is available.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Request-driven Matching</h4>
                                        <p className="text-sm text-amber-500/70">Post the load and timing. Operators can respond from real records and declared availability instead of a simulated instant match.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Evidence-backed Trust Signals</h4>
                                        <p className="text-sm text-amber-500/70">Profiles can show claim state, documents, report cards, and freshness when evidence exists. Missing evidence stays visible.</p>
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
                        <p className="text-gray-400 max-w-xl mx-auto">Connecting source-backed records, request workflows, and physical logistics.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Feature Blocks */}
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
                                <Map className="w-8 h-8 text-amber-500 mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">Crowdsourced Hazard Intel</h4>
                                <p className="text-gray-400 text-sm">Use route reports and field signals where they exist, and treat missing source coverage as a reason to request survey support.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
                                <Zap className="w-8 h-8 text-amber-500 mb-4" />
                                <h4 className="text-xl font-bold text-white mb-2">Rate Benchmarks</h4>
                                <p className="text-gray-400 text-sm">Use rate benchmarks where sample coverage exists. Treat sparse markets as estimates, not guaranteed clearing prices.</p>
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
                                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white font-black text-xl">L</div>
                                    <div>
                                        <div className="text-white font-bold">Lone Star Pilot Cars</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                            <span>ETA: 14 mins</span>
                                            <span>"¢</span>
                                            <span className="text-amber-500">Trust: 96%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-500 hover:bg-amber-400 cursor-pointer text-white text-center font-black py-3 rounded-lg text-sm transition-colors">
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
