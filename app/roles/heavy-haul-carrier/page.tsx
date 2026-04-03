import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Heavy Haul Carriers — Find Flatbed & Lowboy Operators | Haul Command',
  description:
    'Connect with verified heavy haul carriers, flatbed operators, and lowboy specialists. Find equipment, post loads, and manage oversize moves across the US and Canada.',
  alternates: { canonical: 'https://www.haulcommand.com/roles/heavy-haul-carrier' },
};

const ACTIONS = [
  { href: '/directory/us/heavy-haul-carriers', icon: '🔍', label: 'Find Heavy Haul Carriers', desc: 'Browse verified carriers by state, equipment, and capacity', cta: 'Browse Directory →', primary: true },
  { href: '/loads', icon: '📦', label: 'Post a Load', desc: 'List your oversize or overweight move and receive quotes', cta: 'Post a Load →', primary: false },
  { href: '/requirements', icon: '📋', label: 'Permit Requirements', desc: 'State-by-state oversize permit and escort requirements', cta: 'Check Requirements →', primary: false },
  { href: '/claim', icon: '🚛', label: 'List Your Operation', desc: 'Add your carrier business to the Haul Command directory', cta: 'Get Listed →', primary: false },
];

const gold = '#C6923A';

export default function HeavyHaulCarrierPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 0', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
        <span>›</span>
        <span style={{ color: gold }}>Heavy Haul Carriers</span>
      </div>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', margin: '0 0 1rem' }}>
          Heavy Haul <span style={{ color: gold }}>Carriers</span>
        </h1>
        <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 2.5rem', maxWidth: 580, lineHeight: 1.7 }}>
          Find certified heavy haul carriers, flatbed operators, and lowboy specialists.
          Post loads, check permit requirements, and move oversize freight with confidence.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} style={{
              display: 'block', padding: '1.25rem', borderRadius: 14, textDecoration: 'none',
              background: a.primary ? 'rgba(198,146,58,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${a.primary ? 'rgba(198,146,58,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>{a.label}</h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px', lineHeight: 1.5 }}>{a.desc}</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: a.primary ? gold : '#60a5fa' }}>{a.cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
