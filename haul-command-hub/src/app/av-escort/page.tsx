import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:'AV Escort Protocol — Autonomous Vehicle Escort Services',
  description:
    'The first platform to match human pilot car operators with autonomous heavy haul loads. AV Escort certification, compliance standards, and load matching for the autonomous freight transition.',
};

export default function AVEscortPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">AV Escort Protocol</span>
        </nav>

        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">🤖 Wave 1 — AV Transition · 2025–2028</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Autonomous Loads<br />
            <span className="text-cyan-400">Still Need Human Escorts</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Aurora, Kodiak, and Torc are running autonomous heavy haul trucks now.
            Most states require human escort vehicles precisely because the load is autonomous.
            Haul Command is the only platform positioned to match human pilots with AV loads at scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/av-escort/certify" className="bg-cyan-500 text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-cyan-400 transition-colors">
              Get AV-Certified →
            </Link>
            <Link href="/av-escort/operators" className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors">
              AV Operator Network
            </Link>
          </div>
        </header>

        {/* The Opportunity */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { stat: '43 states', desc: 'Require human escort for AV commercial vehicles as of 2025', icon: '🗺️' },
              { stat: '3–7 years', desc: 'Until AV heavy haul scales to meaningful corridor volumes', icon: '⏱️' },
              { stat: '$100M+/mo', desc: 'Projected AV escort marketplace by year 10', icon: '💰' },
            ].map(s => (
              <div key={s.stat} className="bg-white/[0.03] border border-cyan-500/15 rounded-2xl p-6 text-center">
                <div className="text-4xl mb-2">{s.icon}</div>
                <div className="text-cyan-400 font-black text-2xl mb-1">{s.stat}</div>
                <div className="text-gray-400 text-xs">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AV Escort Job Type */}
        <section className="mb-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-black px-3 py-1 rounded-full border border-cyan-500/20">NEW JOB TYPE</span>
            <h2 className="text-xl font-black text-white">AV Escort Required</h2>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            When a broker posts a load flagged as autonomous, it appears in the load board with distinct AV compliance requirements.
            Only AV-certified operators are matched. Different insurance requirements, different compliance checklist, different rate card.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'AV Load Flag', icon: '🤖', desc: 'Tagged at post time by broker' },
              { label: 'AV Certification', icon: '✅', desc: 'Separate cert from standard escort' },
              { label: 'State Compliance', icon: '📋', desc: 'Per-state AV escort rules' },
              { label: 'Premium Rate', icon: '💰', desc: 'AV escort premium pricing' },
            ].map(item => (
              <div key={item.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1.5">{item.icon}</div>
                <div className="text-white text-xs font-bold mb-0.5">{item.label}</div>
                <div className="text-gray-600 text-[9px]">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* AV Companies */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-6">AV Freight Companies We're Built For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Aurora', status: 'Active — TX Corridor', color: 'blue' },
              { name: 'Kodiak', status: 'Active — SE Network', color: 'orange' },
              { name: 'Torc / Daimler', status: 'Testing Phase', color: 'gray' },
              { name: 'Waymo Via', status: 'Pilot Program', color: 'cyan' },
            ].map(co => (
              <div key={co.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
                <div className="text-white font-black text-base mb-1">{co.name}</div>
                <div className="text-cyan-400 text-[10px] font-bold">{co.status}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">Be AV-Certified First</h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Early AV-certified operators will get first access to AV escort loads. Certification is through
            Haul Command Academy and takes 4 hours. AV loads command 20–40% premium over standard escort rates.
          </p>
          <Link href="/av-escort/certify" className="inline-flex bg-cyan-500 text-black px-10 py-4 rounded-xl font-black text-base hover:bg-cyan-400 transition-colors">
            Start AV Certification →
          </Link>
        </div>
      </main>
    </>
  );
}
