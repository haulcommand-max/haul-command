import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck, TrendingUp, Search, Bell } from "lucide-react";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Standard canonical country map for SSG
const TOP_MARKETS = [
  { code: 'us', name: 'United States', status: 'live' },
  { code: 'ca', name: 'Canada', status: 'live' },
  { code: 'gb', name: 'United Kingdom', status: 'expanding', term: 'Abnormal Load' },
  { code: 'au', name: 'Australia', status: 'expanding', term: 'Overmass' },
  { code: 'za', name: 'South Africa', status: 'seeding', term: 'Abnormal Load' },
  { code: 'mx', name: 'Mexico', status: 'seeding', term: 'Carga Sobredimensionada' }
];

export async function generateStaticParams() {
  return TOP_MARKETS.map(market => ({
    country: market.code,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const market = TOP_MARKETS.find(m => m.code === resolvedParams.country);
  if (!market) return { title: "Market Not Found" };

  const term = market.term || 'Oversize Load';
  return {
    title: `${term} Transport & Pilot Directory | ${market.name} | Haul Command`,
    description: `Find verified ${term} escorts, route intelligence, and permitting data in ${market.name}. Claim your operator profile to secure local freight matches.`,
  };
}

export default async function CountryHub({ params }: { params: Promise<{ country: string }> }) {
  const resolvedParams = await params;
  const market = TOP_MARKETS.find(m => m.code === resolvedParams.country);
  if (!market) notFound();

  const term = market.term || 'Oversize Load';

  // Server-side fetch for FOMO stats (In production, replace with actual Supabase RPC aggregations)
  const isLive = market.status === 'live';
  
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col pt-32">
        <div className="max-w-6xl mx-auto w-full space-y-12 animate-in slide-up duration-700">
            {/* SEO Hero & Intent Capture */}
            <div className="text-center space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-hc-surface border border-white/5 text-xs font-mono text-amber-500 uppercase tracking-widest glass-premium">
                    <MapPin className="h-3 w-3" /> {market.name} Command
                </span>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gradient-gold">
                    {market.name} {term} Directory
                </h1>
                <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400">
                    The verified operational layer for {term.toLowerCase()} logistics across {market.name}. Find certified pilots, view active restrictions, and book compliant capacity natively.
                </p>
                
                {/* Search Bar Action */}
                <div className="flex justify-center mt-8">
                    <div className="flex items-center w-full max-w-xl glass-premium border border-white/10 rounded-full p-2 focus-within:border-gold/50 hover:border-white/20 transition-all">
                        <Search className="h-5 w-5 text-slate-500 ml-3" />
                        <input 
                            type="text" 
                            placeholder={`Search ${market.name} escorts, brokers, or corridors...`}
                            className="bg-transparent border-none text-white focus:ring-0 w-full px-4 outline-none placeholder:text-slate-500"
                        />
                        <button className="bg-hc-gold-500 hover:bg-hc-gold-400 text-black px-6 py-2 rounded-full font-bold transition-colors shadow-gold-sm">
                            Locate
                        </button>
                    </div>
                </div>
            </div>

            {/* The FOMO / Claim Trap Section (Double Platinum Conversion) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
                {/* Left: Claim Box */}
                <div className="glass-premium border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-gold/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/20 transition-all" />
                    
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-2">Are you operating in {market.name}?</h3>
                            <p className="text-slate-400 mb-6 text-sm">
                                83% of high-value freight in {market.name} routes through verified operators. Claim your profile to access Level 2 KYC status and bypass standard broker onboarding.
                            </p>
                            <Link href="/claim" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-lg text-black bg-gradient-to-r from-[#F8DFB0] via-[#C6923A] to-[#8A6428] hover:shadow-gold-md transition-all uppercase tracking-wide">
                                Claim Local Profile
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right: AdGrid / B2B Sponsor Teaser */}
                <div className="glass-premium border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                    
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-2xl font-bold text-white">Dominate {market.name}</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase">AdGrid Spot</span>
                            </div>
                            <p className="text-slate-400 mb-6 text-sm">
                                Secure the primary enterprise visibility slot for {term.toLowerCase()} routing across {market.name}. Outbid competitors for high-intent traffic matching $5,000+ freight intent.
                            </p>
                            <Link href="/advertise/corridor" className="inline-flex items-center justify-center px-6 py-3 border border-emerald-500/50 text-sm font-bold rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all uppercase tracking-wide">
                                Sponsor This Market
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Regional Matrix / Sub-markets */}
            <div className="pt-16 border-t border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-slate-100">Live Corridors & Sub-Markets</h2>
                    <span className="text-xs text-slate-500 font-mono">{market.code.toUpperCase()} REGISTRY ACTIVE</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Placeholder structural links for SEO crawling */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Link key={i} href={`/${market.code}/region-${i}`} className="glass-premium border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:border-white/20 transition-all mask-fade-r">
                            <span className="text-sm text-slate-300 font-medium group-hover:text-amber-400 transition-colors">Region {i}</span>
                            <span className="text-xs text-slate-600 font-mono">142</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}
