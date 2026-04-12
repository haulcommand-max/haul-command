import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck, TrendingUp, Search, Database, Lock } from "lucide-react";

// Enable Incremental Static Regeneration for the long-tail 120-country states
export const dynamicParams = true;
export const revalidate = 86400; // Cache for 24 hours

// Canonical seed states (only build the highest priority to save Next.js compile time)
const PRIORITY_STATES = [
  { country: 'us', state: 'tx', name: 'Texas' },
  { country: 'us', state: 'fl', name: 'Florida' },
  { country: 'us', state: 'ca', name: 'California' },
  { country: 'us', state: 'az', name: 'Arizona' },
  { country: 'ca', state: 'ab', name: 'Alberta' },
  { country: 'au', state: 'wa', name: 'Western Australia' },
];

export async function generateStaticParams() {
  return PRIORITY_STATES.map(s => ({
    country: s.country,
    state: s.state,
  }));
}

export async function generateMetadata({ params }: { params: { country: string, state: string } }): Promise<Metadata> {
  const seed = PRIORITY_STATES.find(s => s.state === params.state);
  const stateName = seed ? seed.name : params.state.toUpperCase();
  
  return {
    title: `Oversize Transport & Corridor Directory | ${stateName} | Haul Command`,
    description: `Find verified heavy haul escorts, state restrictions, and active corridors in ${stateName}. Secure AdGrid placement and export local rate intelligence.`,
  };
}

export default async function StateHub({ params }: { params: { country: string, state: string } }) {
  const seed = PRIORITY_STATES.find(s => s.state === params.state);
  const stateName = seed ? seed.name : params.state.toUpperCase();

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col pt-32">
        <div className="max-w-6xl mx-auto w-full space-y-12 animate-in slide-up duration-700">
            {/* SEO Hero & Intent Capture */}
            <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3">
                    <Link href={`/${params.country}`} className="text-sm font-mono text-slate-500 hover:text-amber-500 transition-colors uppercase">
                        {params.country} /
                    </Link>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hc-surface border border-white/5 text-xs font-mono text-amber-500 uppercase tracking-widest glass-premium">
                        <MapPin className="h-3 w-3" /> {stateName}
                    </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gradient-gold">
                    {stateName} Directory & Intelligence
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400">
                    The verified command layer for heavy haul logistics in {stateName}. Search pilots, claim your local authority, and unlock real-time corridor rate intelligence.
                </p>
            </div>

            {/* Trifold Monetization Engine: AdGrid | Data | Claims */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16">
                {/* 1. Claim Trap */}
                <div className="glass-premium border border-white/10 rounded-2xl p-6 relative group hover:border-gold/30 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Claim Local Profile</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Stop missing MSB-settled loads. Verified operators rank first in {stateName} searches.
                    </p>
                    <Link href="/claim" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-bold rounded text-black bg-gradient-to-r from-[#F8DFB0] to-[#C6923A] uppercase">
                        Verify Identity
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
                        Buy the top visibility slot for all {stateName} traffic. Targets brokers with $5k+ intent.
                    </p>
                    <Link href={`/advertise/state?market=${params.state}`} className="w-full inline-flex items-center justify-center px-4 py-2 border border-emerald-500/50 text-sm font-bold rounded text-emerald-400 hover:bg-emerald-500/10 uppercase">
                        Buy Slot — $299/mo
                    </Link>
                </div>

                {/* 3. Data Product Monetization */}
                <div className="glass-premium border border-white/10 rounded-2xl p-6 relative group hover:border-blue-500/30 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                        <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-white">Market Intelligence</h3>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/20">ENTERPRISE</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-6">
                        Unlock exact carrier density mapping and historical rate APIs across {stateName} corridors.
                    </p>
                    <Link href={`/data-products?market=${params.state}`} className="w-full inline-flex items-center gap-2 justify-center px-4 py-2 border border-blue-500/50 text-sm font-bold rounded text-blue-400 hover:bg-blue-500/10 uppercase">
                        <Lock className="h-3 w-3" /> Unlock Data — $99
                    </Link>
                </div>
            </div>

            {/* State Corridors / Routes */}
            <div className="pt-16 border-t border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-100">Major Heavy Haul Corridors</h2>
                    <span className="text-xs text-slate-500 font-mono">LIVE TELEMETRY</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Placeholder structural links targeting Corridors */}
                    {['I-10-Express', 'Permian-Basin-Route', 'Coastal-Access', 'Wind-Energy-Lane', 'Industrial-Loop'].map((corridor) => (
                        <Link key={corridor} href={`/${params.country}/${params.state}/${corridor.toLowerCase()}`} className="glass-premium border border-white/5 rounded-lg p-6 group hover:border-white/20 transition-all flex flex-col gap-2">
                            <span className="text-lg text-slate-100 font-medium group-hover:text-amber-400 transition-colors">{corridor.replace(/-/g, ' ')}</span>
                            <div className="flex justify-between text-xs text-slate-500 font-mono">
                                <span>24 Active Operators</span>
                                <span className="text-emerald-500">CLEAR</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
