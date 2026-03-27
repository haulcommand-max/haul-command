import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Globe, Map, Truck, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Broker Logistics OS | Haul Command Global 57-Country Network',
  description: 'Automate your entire oversize load dispatch pipeline. Connect with pre-vetted pilot cars in 120 countries, calculate instant route costs, and dominate your lane operations.',
  alternates: {
    canonical: 'https://haulcommand.com/broker',
  },
};

export default function BrokerCapturePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-24 overflow-hidden border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/10 to-transparent"></div>
        <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl rounded-full bg-blue-500/30 w-[800px] h-[800px] pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
          <div className="text-center md:text-left md:flex md:items-center md:gap-16">
            <div className="md:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
                <Globe className="w-4 h-4" />
                Now expanding into 120 countries
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Stop chasing pilot cars. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Command them.
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-xl mx-auto md:mx-0">
                The first autonomous operating system for oversized freight brokers. Source vetted escorts, predict accurate lane costs, and instantly manage DOT permits across our Global Tier A network.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
                <a 
                  href="/tools" 
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <Zap className="w-5 h-5" />
                  Try Global Routing Tools
                </a>
                <Link 
                  href="/pricing"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 flex items-center justify-center transition-all"
                >
                  View Agency Pricing
                </Link>
              </div>
              
              <div className="pt-6 flex items-center gap-6 justify-center md:justify-start text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Fully Vetted Network</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>No Setup Fees</span>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 mt-16 md:mt-0 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-2xl rounded-3xl transform -rotate-6"></div>
              <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Instant Multi-State Dispatch</h3>
                    <p className="text-sm text-slate-400">Dallas, TX → Calgary, AB</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-emerald-400">$3,450</span>
                    <span className="text-xs text-slate-500">Est. Total Cost (Lead+Chase)</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { state: 'TX to OK', req: '1 Lead, Height Pole', cost: '$450', status: 'Matched: 2 mins ago' },
                    { state: 'OK to KS', req: '1 Lead', cost: '$300', status: 'Matched: Instant' },
                    { state: 'KS to ND', req: '1 Lead, 1 Chase', cost: '$1,200', status: 'Matched: 5 mins ago' },
                    { state: 'Border Crossing', req: 'Customs + Provincial Lead', cost: '$1,500', status: 'Broker Managed' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div>
                        <div className="text-slate-200 text-sm font-medium">{row.state}</div>
                        <div className="text-slate-500 text-xs">{row.req}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm font-medium">{row.cost}</div>
                        <div className="text-emerald-500 text-xs flex items-center justify-end gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {row.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                  <button className="text-blue-400 text-sm font-medium hover:text-blue-300 flex items-center gap-1 transition-colors">
                    Execute Standing Order <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="py-24 bg-slate-950 border-b border-slate-800/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Outperform Your Competition</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Manual load boards are dead. Haul Command uses continuous deterministic algorithms to match your lanes with precisely qualified, location-verified pilot cars instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deterministic Lane Routing</h3>
              <p className="text-slate-400 leading-relaxed">
                We eliminated probability. Our engine matches operators based strictly on verified proximity, past performance, and exact multi-lingual capability matrices across 120 countries.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Cost Baselines</h3>
              <p className="text-slate-400 leading-relaxed">
                Quote your shippers instantly. Our dataset analyzes 30-day historical corridor rates, crossing-border complexities, and regional density to generate pinpoint cost estimates.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors group">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zero-Lag Push Architecture</h3>
              <p className="text-slate-400 leading-relaxed">
                No SMS delays. No lost emails. Haul Command utilizes a native Push-First architecture to blast your load directly to the home screen of Tier A qualified operators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MANAGED SERVICES CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900"></div>
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[url('/grid.svg')] opacity-10"></div>
        
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-2/3">
              <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold tracking-wide mb-4 border border-blue-500/30">
                Managed Logistics Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Let our AI handle the entire 57-country pipeline.
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl">
                Need end-to-end management? We provide dedicated account executives embedded with our Global OS to handle route surveys, permitting arrays, and multi-vehicle orchestration from origin to destination.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="/api/stripe/checkout?product=managed" 
                  className="px-8 py-4 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  Book Agency Retainer <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div className="md:w-1/3 flex justify-center">
              <div className="w-64 h-64 rounded-full border-[12px] border-blue-500/20 flex flex-col items-center justify-center relative bg-slate-900 shadow-[0_0_50px_rgba(37,99,235,0.2)]">
                <Truck className="w-16 h-16 text-blue-400 mb-2" />
                <div className="text-3xl font-black text-white">57</div>
                <div className="text-sm font-medium text-slate-400">Global Regions</div>
                
                {/* Orbiting dots */}
                <div className="absolute inset-[-12px] border border-blue-400/30 rounded-full animate-[spin_10s_linear_infinite]" style={{ borderStyle: 'dashed' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
