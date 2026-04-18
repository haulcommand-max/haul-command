import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Route, ShieldCheck, TrendingUp, AlertTriangle, Database, Lock } from "lucide-react";

// Enable Incremental Static Regeneration for infinite long-tail corridor scaling
export const dynamicParams = true;
export const revalidate = 3600; // Cache for 1 hour due to high-value route status volatility

const PRIORITY_CORRIDORS = [
  { country: 'us', state: 'tx', corridor: 'permian-basin-route', name: 'Permian Basin Route' },
  { country: 'us', state: 'fl', corridor: 'i-10-express', name: 'I-10 Express Corridor' },
  { country: 'au', state: 'wa', corridor: 'pilbara-mining-access', name: 'Pilbara Mining Access' }
];

export async function generateStaticParams() {
  return PRIORITY_CORRIDORS.map(c => ({
    country: c.country,
    state: c.state,
    corridor: c.corridor,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string, state: string, corridor: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const seed = PRIORITY_CORRIDORS.find(c => c.corridor === resolvedParams.corridor);
  const corridorName = seed ? seed.name : resolvedParams.corridor.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return {
    title: `${corridorName} Heavy Haul Directory & Route Intelligence | Haul Command`,
    description: `Real-time heavy haul route clearance, verified pilot cars, and carrier density along ${corridorName}. Unlock rate API data and secure local AdGrid placement.`,
  };
}

export default async function CorridorHub({ params }: { params: Promise<{ country: string, state: string, corridor: string }> }) {
  const resolvedParams = await params;
  const seed = PRIORITY_CORRIDORS.find(c => c.corridor === resolvedParams.corridor);
  const corridorName = seed ? seed.name : resolvedParams.corridor.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col pt-32">
        <div className="max-w-6xl mx-auto w-full space-y-12 animate-in slide-up duration-700">
            {/* SEO Hero & Intent Capture */}
            <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2">
                    <Link href={`/${resolvedParams.country}`} className="text-sm font-mono text-slate-500 hover:text-amber-500 transition-colors uppercase">
                        {resolvedParams.country} /
                    </Link>
                    <Link href={`/${resolvedParams.country}/${resolvedParams.state}`} className="text-sm font-mono text-slate-500 hover:text-amber-500 transition-colors uppercase">
                        {resolvedParams.state} /
                    </Link>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hc-surface border border-emerald-500/20 text-xs font-mono text-emerald-500 uppercase tracking-widest glass-premium">
                        <Route className="h-3 w-3" /> ACTIVE CORRIDOR
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gradient-gold">
                    {corridorName} Intelligence
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-slate-400">
                    Real-time operational density, restriction monitoring, and verified operator capacity for the {corridorName} routing network.
                </p>
            </div>

            {/* Trifold Monetization Engine: AdGrid | Data | Claims */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-12">
                {/* 1. Claim Trap */}
                <div className="glass-premium border border-white/10 rounded-2xl p-6 relative group hover:border-gold/30 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Are you running this route?</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Claim your authority on the {corridorName}. When brokers search this exact lane, your verified profile will rank first.
                    </p>
                    <Link href="/claim" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded text-black bg-gradient-to-r from-[#F8DFB0] to-[#C6923A] uppercase">
                        Claim Route Authority
                    </Link>
                </div>

                {/* 2. AdGrid Self-Serve */}
                <div className="glass-premium border border-white/10 rounded-2xl p-6 relative group hover:border-emerald-500/30 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">AdGrid Sponsor</h3>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">SELF-SERVE</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">
                        Dominate broker searches exclusively for the {corridorName} lane. Lock out local competitors instantly.
                    </p>
                    <Link href={`/advertise/corridor?lane=${resolvedParams.corridor}`} className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-500/50 text-sm font-bold rounded text-emerald-400 hover:bg-emerald-500/10 uppercase">
                        Buy Slot — $149/mo
                    </Link>
                </div>

                {/* 3. Data Product Monetization */}
                <div className="glass-premium border border-white/10 rounded-2xl p-6 relative group hover:border-blue-500/30 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">Rate Intelligence API</h3>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/20">ENTERPRISE</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">
                        Export live quote averages and carrier density bottlenecks specific to the {corridorName}.
                    </p>
                    <Link href={`/data-products?lane=${resolvedParams.corridor}`} className="w-full inline-flex items-center gap-2 justify-center px-4 py-2 border border-blue-500/50 text-sm font-bold rounded text-blue-400 hover:bg-blue-500/10 uppercase">
                        <Lock className="h-3 w-3" /> Unlock API — $49/mo
                    </Link>
                </div>
            </div>

            {/* Hyperlocal Directory Fallback View */}
            <div className="pt-16 border-t border-white/5">
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-xl font-bold text-slate-100">Live Operator Hub</h2>
                    <span className="px-2 py-1 rounded text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertTriangle className="h-3 w-3 inline mr-1" /> ACTIVE RESTRICTION WARNINGS</span>
                </div>
                
                {/* SSG Directory Grid Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="glass-premium border border-white/5 rounded-xl p-4 flex gap-4">
                            <div className="h-16 w-16 bg-slate-900 rounded-lg flex-shrink-0 border border-white/10 mt-1" />
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-slate-100 font-bold">Verified Operator {i}X</h4>
                                        <p className="text-xs text-slate-500">Level 2 Pilot Car • Route Authority</p>
                                    </div>
                                    <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">AVAILABLE</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
