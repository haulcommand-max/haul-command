import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dispatchers — Heavy Haul Dispatch Tools & Directory | Haul Command',
  description:
    'Tools and resources for heavy haul dispatchers. Manage loads, coordinate escorts, track permits, and connect with verified operators across the US and Canada.',
  alternates: { canonical: 'https://www.haulcommand.com/roles/dispatcher' },
};

const ACTIONS = [
  { href: '/loads', icon: '📡', label: 'Open Load Board', desc: 'See all active oversize loads needing dispatch coverage', cta: 'View Loads →', primary: true },
  { href: '/directory/us/pilot-car-companies', icon: '🔍', label: 'Find Escort Vehicles', desc: 'Locate verified pilot car operators available in any state', cta: 'Find Escorts →', primary: false },
  { href: '/requirements', icon: '📋', label: 'State Requirements', desc: 'Look up escort and permit requirements for any jurisdiction', cta: 'Check Rules →', primary: false },
  { href: '/map', icon: '🗺️', label: 'Live Dispatch Map', desc: 'Track active loads, corridors, and operator positions in real time', cta: 'Open Map →', primary: false },
];

const gold = '#C6923A';

export default function DispatcherPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 0', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
        <span>›</span>
        <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
        <span>›</span>
        <span style={{ color: gold }}>Dispatchers</span>
      </div>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', margin: '0 0 1rem' }}>
          Heavy Haul <span style={{ color: gold }}>Dispatchers</span>
        </h1>
        <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 2.5rem', maxWidth: 580, lineHeight: 1.7 }}>
          Manage loads, coordinate escorts, and track permits. Everything a heavy haul
          dispatcher needs — in one platform.
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
