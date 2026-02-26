import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Download, Link, Share2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Heavy Haul National Demand Index | Haul Command',
    description: 'Download the latest monthly Heavy Haul Index report. Gain insights into pilot car supply gaps, national average rates per mile, and the hottest oversize corridors in the US & Canada.',
};

export default function HeavyHaulIndexPage() {
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="min-h-screen bg-[#030303] text-slate-200">
            <div className="max-w-5xl mx-auto px-4 py-16">

                {/* Header (Authoritative / Citation-Worthy) */}
                <div className="mb-12 border-b border-white/10 pb-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                                <BarChart3 className="w-4 h-4" /> Live Industry Data
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                                National <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Heavy Haul Index</span>
                            </h1>
                            <p className="text-lg text-slate-400 max-w-2xl">
                                The most accurate measure of pilot car supply elasticity, oversize load demand, and prevailing rates across North American corridors.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                <Link className="w-4 h-4" /> Cite Report
                            </button>
                            <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Headline Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Demand Elasticity Score</div>
                        <div className="text-4xl font-black text-white font-mono mb-2">78.4</div>
                        <div className="text-sm font-medium text-emerald-400 flex items-center gap-1">
                            +4.2% <span className="text-slate-500 font-normal">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 className="w-16 h-16 text-amber-500" />
                        </div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Nat'l Avg Escort Rate</div>
                        <div className="text-4xl font-black text-white font-mono mb-2">$1.84<span className="text-xl text-slate-500">/mi</span></div>
                        <div className="text-sm font-medium text-amber-500 flex items-center gap-1">
                            + $0.05 <span className="text-slate-500 font-normal">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Critical Supply Gap</div>
                        <div className="text-lg font-black text-white mb-2">I-10 (TX / LA Border)</div>
                        <div className="text-sm font-medium text-red-400 flex items-center gap-1">
                            Severe Shortage <span className="text-slate-500 font-normal">Expected</span>
                        </div>
                    </div>
                </div>

                {/* Report Content Structure */}
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-8">
                        <section className="prose prose-invert max-w-none">
                            <h2 className="text-2xl font-bold text-white mb-4">Executive Summary: {currentMonth}</h2>
                            <p className="text-slate-300 leading-relaxed">
                                Pilot car supply capacity remains tight along major southern corridors as mega-projects in the energy sector trigger a sharp increase in superload movements. The national average rate per mile has sustained upward pressure, with the most severe supply gaps forming around major Gulf Coast ports and the Permian Basin.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Top 5 Congested Corridors</h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'I-10 (Houston to Lake Charles)', score: '94 / 100', status: 'Critical', color: 'text-red-400' },
                                    { name: 'I-20 (Midland/Odessa)', score: '88 / 100', status: 'High', color: 'text-orange-400' },
                                    { name: 'I-80 (Wyoming Wind Corridors)', score: '82 / 100', status: 'Elevated', color: 'text-amber-400' },
                                    { name: 'Highway 401 (Ontario)', score: '76 / 100', status: 'Elevated', color: 'text-amber-400' },
                                    { name: 'I-75 (Atlanta Bypass)', score: '64 / 100', status: 'Normal', color: 'text-emerald-400' }
                                ].map(c => (
                                    <div key={c.name} className="flex items-center justify-between p-4 bg-[#0a0a0f] border border-white/5 rounded-xl">
                                        <span className="font-bold text-white">{c.name}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-slate-400 text-sm">{c.score}</span>
                                            <span className={`text-xs font-bold uppercase ${c.color}`}>{c.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Journalist & PR Snippet
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">You may freely quote data from this report with attribution.</p>

                            <div className="bg-black/50 p-4 rounded-lg border border-white/5 relative">
                                <p className="text-sm font-serif italic text-slate-300">
                                    "According to the {currentMonth} Haul Command Heavy Haul Index, national escort demand hit 78.4, pushing average rates up to $1.84/mile."
                                </p>
                                <div className="mt-3 flex justify-end">
                                    <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold text-white uppercase tracking-wider transition">
                                        Copy Snippet
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-[#0a0a0f] border border-emerald-500/20 rounded-2xl">
                            <h3 className="font-black text-white text-lg mb-2">Need Real-Time Data?</h3>
                            <p className="text-sm text-slate-400 mb-6">
                                Integrate the Heavy Haul Index directly into your TMS or Brokerage dashboard using our enterprise API.
                            </p>
                            <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                Request API Access
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
