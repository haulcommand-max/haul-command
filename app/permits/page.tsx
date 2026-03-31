import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Permit Agent Marketplace | Haul Command',
  description: 'Find verified permit agents for your oversize and heavy haul routes. Get permits faster with professionals who know the process.',
};

export default function PermitsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(0,212,255,0.12)', color: '#00d4ff', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Marketplace</span>
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 16px' }}>Permit Agent<br /><span style={{ background: 'linear-gradient(90deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Marketplace</span></h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 560, margin: '0 auto' }}>Stop wrestling with state permit offices. Connect with verified permit professionals who handle everything for you.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { icon: '📋', title: 'Post Your Route', desc: 'Enter origin, destination, and load dimensions. Our system matches you with agents who cover those states.', step: '1' },
            { icon: '🧑‍💼', title: 'Agent Bids', desc: 'Verified permit agents quote turnaround time and price. Choose based on ratings and experience.', step: '2' },
            { icon: '✅', title: 'Permits Delivered', desc: 'Agent files permits across all required states. You get digital copies ready for your load.', step: '3' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 28, background: 'rgba(255,255,255,0.04)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,255,136,0.15)', color: '#00ff88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{s.step}</div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
          <Link aria-label="Navigation Link" href="/permits/request" style={{ display: 'block', padding: '24px', borderRadius: 14, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Request Permits</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Post your route and get agent quotes</div>
          </Link>
          <Link aria-label="Navigation Link" href="/permits/agents" style={{ display: 'block', padding: '24px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textDecoration: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Browse Agents</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Find permit agents by state</div>
          </Link>
        </div>

        <div style={{ padding: 28, background: 'rgba(255,200,0,0.06)', borderRadius: 14, border: '1px solid rgba(255,200,0,0.15)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>🧑‍💼 Are you a permit professional?</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', lineHeight: 1.6 }}>List your services on Haul Command for $29/month. Access hundreds of permit requests from operators and brokers across the country.</p>
          <a href="mailto:permits@haulcommand.com" style={{ color: '#ffc800', fontSize: 14, fontWeight: 600 }}>Apply to become a listed agent →</a>
        </div>
      </div>
    </div>
  );
}
