import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Permit Agents Directory — Oversize/Overweight Permit Professionals | Haul Command',
  description: 'Browse verified permit agents covering all 50 US states. Agents handle oversize/overweight permits so you can focus on your loads.',
};

// Seed permit agent data for SSG
const SEED_AGENTS = [
  { id: '1', name: 'National Permit Services', states: ['TX', 'OK', 'KS', 'NE', 'CO', 'NM', 'AR', 'LA', 'MO'], rate: 175, turnaround: 24, completed: 2340, rating: 4.9, verified: true },
  { id: '2', name: 'Oversize Permits LLC', states: ['CA', 'AZ', 'NV', 'OR', 'WA', 'UT', 'ID', 'MT'], rate: 195, turnaround: 36, completed: 1820, rating: 4.8, verified: true },
  { id: '3', name: 'Eastern Corridor Permits', states: ['NY', 'PA', 'NJ', 'CT', 'MA', 'MD', 'VA', 'DE', 'DC'], rate: 210, turnaround: 48, completed: 1560, rating: 4.7, verified: true },
  { id: '4', name: 'Heartland Permit Group', states: ['IA', 'IL', 'IN', 'OH', 'MI', 'WI', 'MN'], rate: 165, turnaround: 24, completed: 980, rating: 4.9, verified: true },
  { id: '5', name: 'Southeast Permits Pro', states: ['FL', 'GA', 'SC', 'NC', 'TN', 'AL', 'MS'], rate: 155, turnaround: 24, completed: 1240, rating: 4.6, verified: true },
  { id: '6', name: 'Big Sky Permits', states: ['MT', 'WY', 'ND', 'SD', 'NE', 'CO', 'ID'], rate: 185, turnaround: 36, completed: 720, rating: 4.8, verified: false },
];

export default function PermitAgentsPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .agent-card{background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;transition:all 0.2s;}
        .agent-card:hover{border-color:rgba(198,146,58,0.2);transform:translateY(-2px);box-shadow:0 12px 40px -8px rgba(0,0,0,0.4);}
        .state-chip{display:inline-flex;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(198,146,58,0.08);border:1px solid rgba(198,146,58,0.15);color:#C6923A;}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
            <span className="text-[#5A6577] mx-1">/</span>
            <Link href="/permits" className="text-sm text-[#8fa3b8] hover:text-white">Permits</Link>
            <span className="text-[#5A6577] mx-1">/</span>
            <span className="text-sm font-semibold text-white">Agents</span>
          </div>
          <Link href="/permits/request" className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: 'rgba(198,146,58,0.15)', color: '#C6923A' }}>Request Permit</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>Permit Agents</h1>
          <p className="text-sm text-[#8fa3b8] max-w-lg">Verified permit professionals covering all 50 states. Agents handle oversize/overweight permit processing so you can focus on moving loads.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SEED_AGENTS.map(a => (
            <div key={a.id} className="agent-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">{a.name}</h3>
                    {a.verified && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✓ Verified</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-[#8fa3b8]">{a.completed.toLocaleString()} permits completed</span>
                    <span className="text-[10px] font-bold text-[#C6923A]">★ {a.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#C6923A]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>${a.rate}</div>
                  <div className="text-[9px] text-[#5A6577]">per permit</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] text-[#5A6577] font-bold">Turnaround:</span>
                <span className="text-[10px] font-bold text-emerald-400">{a.turnaround}h avg</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {a.states.map(s => <span key={s} className="state-chip">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
