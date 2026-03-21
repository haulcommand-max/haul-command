import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Permit Agent Marketplace — Find a Permit Agent for Your Route | Haul Command',
  description: 'Find experienced oversize/overweight permit agents for any route. Posted permit requests get matched with verified agents. 12% platform fee, $29/mo agent listing.',
};

export default function PermitsPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .permit-card{background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;transition:all 0.2s;}
        .permit-card:hover{border-color:rgba(198,146,58,0.2);transform:translateY(-2px);}
        .permit-cta{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:800;border:none;cursor:pointer;transition:all 0.2s;}
        .permit-cta--primary{background:linear-gradient(135deg,#C6923A,#E0B05C,#C6923A);color:#0a0a0f;box-shadow:0 4px 24px rgba(198,146,58,0.3);}
        .permit-cta--secondary{background:rgba(255,255,255,0.06);color:#f5f7fb;border:1px solid rgba(255,255,255,0.1);}
        .step-number{width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;background:rgba(198,146,58,0.1);color:#C6923A;border:1px solid rgba(198,146,58,0.2);flex-shrink:0;}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
            <span className="text-[#5A6577] mx-1">/</span>
            <span className="text-sm font-semibold text-white">Permits</span>
          </div>
          <div className="flex gap-3">
            <Link href="/permits/agents" className="text-xs font-semibold text-[#8fa3b8] hover:text-white px-3 py-2">Browse Agents</Link>
            <Link href="/permits/request" className="text-xs font-bold px-4 py-2 rounded-xl" style={{ background: 'rgba(198,146,58,0.15)', color: '#C6923A' }}>Request Permit</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.25em] mb-3">Permit Marketplace</div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Find a Permit Agent for Your Route
          </h1>
          <p className="text-[#8fa3b8] text-sm max-w-lg mx-auto leading-relaxed">
            Post your permit request with route and load details. Verified permit agents bid on your job. Pay only when the permit is delivered.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/permits/request">
              <button className="permit-cta permit-cta--primary">Post a Permit Request →</button>
            </Link>
            <Link href="/permits/agents">
              <button className="permit-cta permit-cta--secondary">Browse Agents</button>
            </Link>
          </div>
        </div>

        {/* How it Works */}
        <div className="mb-14">
          <h2 className="text-sm font-black text-white uppercase tracking-wider text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { n: '1', title: 'Post Your Request', desc: 'Enter your origin, destination states, load dimensions, and when you need the permit.' },
              { n: '2', title: 'Get Matched', desc: 'Verified permit agents covering your states receive your request and respond with quotes.' },
              { n: '3', title: 'Permit Delivered', desc: 'Agent processes your permits. You pay through Haul Command escrow. 12% platform fee.' },
            ].map(s => (
              <div key={s.n} className="permit-card">
                <div className="step-number mb-4">{s.n}</div>
                <h3 className="text-sm font-black text-white mb-2">{s.title}</h3>
                <p className="text-xs text-[#8fa3b8] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* For Agents CTA */}
        <div className="permit-card text-center py-10">
          <h3 className="text-lg font-black text-white mb-2">Are You a Permit Agent?</h3>
          <p className="text-sm text-[#8fa3b8] mb-5 max-w-md mx-auto">List your services on Haul Command. Get matched with operators and brokers who need permits for their routes. $29/month to maintain a listed profile.</p>
          <Link href="/onboarding/start">
            <button className="permit-cta permit-cta--primary">Become a Permit Agent →</button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
          {[
            { label: 'Platform Fee', value: '12%' },
            { label: 'Agent Listing', value: '$29/mo' },
            { label: 'Avg Turnaround', value: '24–48h' },
            { label: 'States Covered', value: '50' },
          ].map(s => (
            <div key={s.label} className="permit-card text-center">
              <div className="text-xl font-black text-[#C6923A]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{s.value}</div>
              <div className="text-[10px] font-bold text-[#5A6577] uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
