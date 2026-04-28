import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';


export const runtime = 'edge';

export const metadata: Metadata = {
  title:'OSOW Haven Alternative — The Global Pilot Car Network',
  description: 'Looking for an OSOW Haven alternative? Unfetter your logistics with Haul Command’s live directory of 7,800+ verified pilot cars and autonomous 120-country routing.',
  openGraph: {
    title: 'OSOW Haven Alternative: Upgrade to Haul Command',
    description: 'Stop using fragmented, static pilot car directories. Access Haul Command’s live global network with instant dispatch, real-time rates, and integrated permit tools.',
  },
};

export default function OsowHavenAlternativePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans selection:bg-accent selection:text-black">
      <Navbar />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-6">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Directory Comparison</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
              The only <span className="text-blue-400">OSOW Haven Alternative</span> that actively dispatches.
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
              Stop relying on static lists and outdated phone numbers. Haul Command gives you access to the world's most advanced pilot car network, featuring <strong className="text-white">live availability, automated compliance matching, and instant deployment</strong> across 120 countries.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/directory" className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                Search Global Directory
              </Link>
              <Link href="/broker" className="bg-white/[0.05] text-white px-8 py-4 rounded-xl font-bold hover:bg-white/[0.1] transition-colors border border-white/[0.1]">
                Broker Automation
              </Link>
            </div>
          </div>
        </section>

        {/* The "Smash" Comparison */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-white text-center mb-12">How We Crush Static Directories</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Them */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 blur-3xl rounded-full" />
                <h3 className="text-gray-500 font-bold text-xl mb-6">OSOW Haven & Legacy Boards</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">Stale, Unverified Data</strong>
                      <span className="text-gray-600 text-sm">You spend hours calling down a static list only to find disconnected numbers or unavailable drivers.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">No Compliance Engine</strong>
                      <span className="text-gray-600 text-sm">You have to manually verify if the operator has the right certifications (Amber lights, Height Pole, TWIC) for the states they're crossing.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <div>
                      <strong className="text-gray-300 block">Zero Integration</strong>
                      <span className="text-gray-600 text-sm">No connection to route planning, permit costs, or active job dispatch pipelines.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Us */}
              <div className="bg-gradient-to-br from-white/[0.08] to-transparent border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-blue-500/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full" />
                <h3 className="text-white font-black text-2xl mb-6 flex items-center gap-2">
                  <span className="text-accent">HAUL</span> COMMAND
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">✅</span>
                    <div>
                      <strong className="text-white block">Deterministic Dispatching</strong>
                      <span className="text-gray-400 text-sm">Our Global Routing Engine strictly matches operators based on confirmed proximity and live availability—no dead ends.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">✅</span>
                    <div>
                      <strong className="text-white block">Automated Compliance Parsing</strong>
                      <span className="text-gray-400 text-sm">If your load requires a NY-certified escort and a Height Pole, our directory hides anyone who doesn't explicitly meet the requirements.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">✅</span>
                    <div>
                      <strong className="text-white block">Push-First Infrastructure</strong>
                      <span className="text-gray-400 text-sm">Instantly push loads to qualified operators' devices instead of waiting for them to check a tedious load board.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section className="py-16 px-4 bg-white/[0.02] border-y border-white/[0.05]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-gray-500 text-xs font-bold tracking-widest uppercase mb-12">Upgrade Your Workflow</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Search Global Directory', link: '/directory', icon: '🌍' },
                { name: 'Multi-State Routing', link: '/tools/route-planner', icon: '🗺️' },
                { name: 'Automated Broker Flow', link: '/broker', icon: '⚡' },
                { name: 'Claim Your Profile', link: '/claim', icon: '🛡️' },
              ].map((f, i) => (
                <Link key={i} href={f.link} className="block bg-black border border-white/10 rounded-xl p-6 hover:border-blue-500/40 transition-all group">
                  <span className="text-2xl mb-3 block">{f.icon}</span>
                  <h4 className="text-white font-bold text-sm mb-2">{f.name}</h4>
                  <span className="text-blue-400 text-xs font-bold group-hover:underline">Access Now →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        
      </main>

    </div>
  );
}
