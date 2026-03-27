import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';


export const runtime = 'edge';

export const metadata: Metadata = {
  title:'Oversize.io Alternative — The Free routing & permitting OS',
  description: 'Looking for an Oversize.io alternative? Haul Command gives you the 30 heaviest routing, permit, and escort calculators completely free, backed by a live 7,800+ directory.',
  openGraph: {
    title: 'Oversize.io Alternative: Upgrade to Haul Command',
    description: 'Stop paying monthly software fees just to calculate axle weights. Access 30 tools for free and connect with real escorts on Haul Command.',
  },
};

export default function OversizeIoAlternativePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-accent selection:text-black">
      <Navbar />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 mb-6">
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Competitor Comparison</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
              The only <span className="text-accent">Oversize.io Alternative</span> that connects to a live network.
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
              Why pay $29/month just for calculators? Haul Command gives you 30 heavy haul calculators—Axle Weights, Curfew Checkers, Bridge Formulas, and Permit Estimators—<strong className="text-white">completely free</strong>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tools" className="bg-accent text-black px-8 py-4 rounded-xl font-bold hover:bg-yellow-500 transition-colors shadow-[0_0_30px_rgba(255,204,0,0.3)]">
                Access Free Tools
              </Link>
              <Link href="/pricing" className="bg-white/[0.05] text-white px-8 py-4 rounded-xl font-bold hover:bg-white/[0.1] transition-colors border border-white/[0.1]">
                View Elite Plans
              </Link>
            </div>
          </div>
        </section>

        {/* The "Smash" Comparison */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-white text-center mb-12">How We Crush The Competition</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Them */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full" />
                <h3 className="text-gray-500 font-bold text-xl mb-6">Oversize.io</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">Paywalled Calculators</strong>
                      <span className="text-gray-600 text-sm">Forces you into monthly plans just to check axle weight limits or basic curfew times.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">Static Software Island</strong>
                      <span className="text-gray-600 text-sm">You calculate a route, but then you have to exit the software and go to a Facebook group to actually find escorts.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">Fragmented Workflow</strong>
                      <span className="text-gray-600 text-sm">No live global directory attached. No direct Managed Permit procurement loop.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Us */}
              <div className="bg-gradient-to-br from-white/[0.08] to-transparent border border-accent/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-accent/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />
                <h3 className="text-white font-black text-2xl mb-6 flex items-center gap-2">
                  <span className="text-accent">HAUL</span> COMMAND
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">✅</span>
                    <div>
                      <strong className="text-white block">30 Ultra-Tools. 100% Free.</strong>
                      <span className="text-gray-400 text-sm">Route planners, multi-state permit estimators, 120-country regulations, bridge formulas—all free forever.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">✅</span>
                    <div>
                      <strong className="text-white block">The 7,800+ Live Directory</strong>
                      <span className="text-gray-400 text-sm">Ran a route calculation? Instantly see compliant pilot cars in a 150-mile radius ready for dispatch.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">✅</span>
                    <div>
                      <strong className="text-white block">Integrated Execution</strong>
                      <span className="text-gray-400 text-sm">Don't just calculate permit costs. Click "Order Permits" or "Managed Dispatch" and we handle execution.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Smash Grid */}
        <section className="py-16 px-4 bg-white/[0.02] border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-gray-500 text-xs font-bold tracking-widest uppercase mb-12">Feature-For-Feature Domination</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Axle Weight Calculator', us: '/tools/axle-weight', icon: '⚖️' },
                { name: 'Permit Cost Estimator', us: '/tools/permit-cost', icon: '🎫' },
                { name: 'State Regulations', us: '/requirements', icon: '📋' },
                { name: 'Multi-State Routing', us: '/tools/route-planner', icon: '🗺️' },
              ].map((f, i) => (
                <Link key={i} href={f.us} className="block bg-black border border-white/10 rounded-xl p-6 hover:border-accent/40 transition-all group">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h4 className="text-white font-bold text-sm mb-2">{f.name}</h4>
                  <span className="text-accent text-xs font-bold group-hover:underline">Use Free Tool →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
      </main>

    </div>
  );
}
