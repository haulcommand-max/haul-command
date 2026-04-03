import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pilot Car Operators — Find Certified Escort Vehicle Services | Haul Command',
  description:
    'The largest pilot car operator directory in the US and Canada. Find certified escort vehicles by state, check requirements, post your availability, and connect with the heavy haul network.',
  keywords: [
    'pilot car operators',
    'escort vehicle operators',
    'oversize load escort',
    'heavy haul pilot car',
    'find pilot car near me',
    'certified escort vehicle',
    'pilot car company directory',
  ],
  alternates: {
    canonical: 'https://www.haulcommand.com/roles/pilot-car-operator',
  },
  openGraph: {
    title: 'Pilot Car Operators | Haul Command',
    description:
      'Find certified pilot car operators across the US and Canada. Browse the directory, check requirements by state, and connect instantly.',
    url: 'https://www.haulcommand.com/roles/pilot-car-operator',
    siteName: 'Haul Command',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Pilot Car Operators | Haul Command',
  description:
    'Directory and resource hub for pilot car operators in the heavy haul and oversize load transportation industry.',
  url: 'https://www.haulcommand.com/roles/pilot-car-operator',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://www.haulcommand.com/directory' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Pilot Car Operators',
        item: 'https://www.haulcommand.com/roles/pilot-car-operator',
      },
    ],
  },
};

const QUICK_ACTIONS = [
  {
    href: '/directory/us/pilot-car-companies',
    icon: '🔍',
    label: 'Find a Pilot Car Operator',
    desc: 'Search verified escort vehicle operators by state, certification, and availability',
    cta: 'Browse Directory →',
    primary: true,
  },
  {
    href: '/requirements',
    icon: '📋',
    label: 'Escort Requirements by State',
    desc: 'Look up escort vehicle rules, dimensions, and regulations for any state',
    cta: 'Check Requirements →',
    primary: false,
  },
  {
    href: '/loads',
    icon: '📡',
    label: 'Open Load Board',
    desc: 'See oversize loads actively looking for escort vehicles right now',
    cta: 'View Load Board →',
    primary: false,
  },
  {
    href: '/claim',
    icon: '🪪',
    label: 'List Your Pilot Car Business',
    desc: 'Add your operation to the directory and get found by brokers and carriers',
    cta: 'Get Listed Free →',
    primary: false,
  },
];

const US_STATES = [
  'Texas', 'Florida', 'California', 'Ohio', 'Georgia',
  'North Carolina', 'Pennsylvania', 'Michigan', 'Illinois', 'Tennessee',
  'Washington', 'Oregon', 'Louisiana', 'Alabama', 'Mississippi',
];

async function getOperatorCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('hc_places')
      .select('id', { count: 'exact', head: true })
      .eq('place_type', 'pilot_car_company')
      .eq('status', 'published');
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function PilotCarOperatorPage() {
  const operatorCount = await getOperatorCount();
  const gold = '#C6923A';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ minHeight: '100vh', background: '#080810', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* ── Breadcrumb ──────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
          <span>›</span>
          <span style={{ color: gold }}>Pilot Car Operators</span>
        </div>

        {/* ── Hero ────────────────────────────────────────── */}
        <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(198,146,58,0.1), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1 }}>
                Haul Command Network
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Pilot Car<br />
                  <span style={{ color: gold }}>Operators</span>
                </h1>
                <p style={{ margin: '0 0 1.5rem', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 560 }}>
                  The heavy haul industry runs on certified escort vehicles. Find operators,
                  post your availability, check state requirements, and manage your operation —
                  all in one place.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link href="/directory/us/pilot-car-companies" style={{
                    display: 'inline-flex', alignItems: 'center', padding: '14px 32px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${gold}, #E4B872)`,
                    color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none',
                  }}>
                    Search the Directory →
                  </Link>
                  <Link href="/claim" style={{
                    display: 'inline-flex', alignItems: 'center', padding: '14px 24px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e5e7eb', fontSize: 15, fontWeight: 700, textDecoration: 'none',
                  }}>
                    List My Business
                  </Link>
                </div>
              </div>

              {/* Live stat */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
                {[
                  { value: operatorCount > 0 ? operatorCount.toLocaleString() : '1,500+', label: 'Listed Operators' },
                  { value: '50', label: 'States Covered' },
                  { value: '< 2 clicks', label: 'To Find Escort' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: gold }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick Actions — 1 click to anything ─────────── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>
            What are you looking for?
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, marginTop: 0 }}>
            Get to what you need in one click.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href} style={{
                display: 'block', padding: '1.25rem', borderRadius: 14, textDecoration: 'none',
                background: action.primary ? 'rgba(198,146,58,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${action.primary ? 'rgba(198,146,58,0.25)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{action.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>{action.label}</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px', lineHeight: 1.5 }}>{action.desc}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: action.primary ? gold : '#60a5fa' }}>
                  {action.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Browse by State ──────────────────────────────── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 2.5rem' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>
            Browse Pilot Car Operators by State
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, marginTop: 0 }}>
            Most active markets — click any state to see available operators.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {US_STATES.map((state) => (
              <Link
                key={state}
                href={`/directory/us/${state.toLowerCase().replace(/\s+/g, '-')}/pilot-car-companies`}
                style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  color: '#d1d5db', textDecoration: 'none',
                }}
              >
                {state}
              </Link>
            ))}
            <Link href="/directory/us/pilot-car-companies" style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.2)',
              color: gold, textDecoration: 'none',
            }}>
              All States →
            </Link>
          </div>
        </section>

        {/* ── SEO Content ──────────────────────────────────── */}
        <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
          <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', margin: '0 0 12px' }}>
              About Pilot Car Operators on Haul Command
            </h2>
            <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0 }}>
                Pilot car operators — also called escort vehicle operators — are a critical
                component of every oversize and overweight load movement in the United States
                and Canada. Haul Command maintains the most comprehensive directory of certified
                escort vehicle operators across all 50 states.
              </p>
              <p style={{ margin: 0 }}>
                Each state has its own escort vehicle requirements, certification standards, and
                equipment rules. Use the{' '}
                <Link href="/requirements" style={{ color: gold }}>
                  state requirements tool
                </Link>{' '}
                to look up exactly what&apos;s required before booking or operating in any jurisdiction.
              </p>
              <p style={{ margin: 0 }}>
                Whether you&apos;re a broker needing certified escort coverage for a permitted load,
                or a pilot car operator looking to grow your client base, Haul Command connects
                the heavy haul ecosystem in real time.
              </p>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
