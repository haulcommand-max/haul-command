import type { Metadata } from 'next';
import { HubMap } from '@/components/ui/HubMap';
import { GatedCTA } from '@/components/ui/GatedCTA';
import { StateButton, StateButtonGrid } from '@/components/ui/StateButton';
import Link from 'next/link';


export const metadata: Metadata = {
    title: 'Pilot Car Services in the United States | Haul Command',
    description: 'Find verified pilot car and escort vehicle operators across all 50 US states. Real-time availability, trust scores, and corridor intelligence — powered by Haul Command.',
    openGraph: {
        title: 'Pilot Car Services in the United States | Haul Command',
        description: 'Verified escort vehicle operators in all 50 states. Click your state to search.',
        url: 'https://haulcommand.com/united-states',
    },
};

const TOP_STATES = [
    { code: 'tx', label: 'Texas', emoji: '🤠', note: 'Highest permit volume' },
    { code: 'ca', label: 'California', emoji: '🌁', note: 'Port-heavy corridors' },
    { code: 'fl', label: 'Florida', emoji: '🌴', note: 'Mobile home capital' },
    { code: 'oh', label: 'Ohio', emoji: '⚙️', note: 'Manufacturing crossroads' },
    { code: 'pa', label: 'Pennsylvania', emoji: '🏭', note: 'I-80 / I-78 corridor' },
    { code: 'nd', label: 'North Dakota', emoji: '🛢️', note: 'Bakken oil field ops' },
    { code: 'wy', label: 'Wyoming', emoji: '⛰️', note: 'Wind turbine routes' },
    { code: 'ga', label: 'Georgia', emoji: '🍑', note: 'Port of Savannah gateway' },
    { code: 'wa', label: 'Washington', emoji: '🌲', note: 'Boeing + port loads' },
    { code: 'co', label: 'Colorado', emoji: '🏔️', note: 'Mountain corridor specialist' },
];

export default function UnitedStatesPage() {
    return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
            {/* Hero */}
            <section style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#d97706', textTransform: 'uppercase', marginBottom: 12 }}>
                    🇺🇸 United States Directory
                </div>
                <h1 style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
                    Pilot Car Services Across All 50 States
                </h1>
                <p style={{ fontSize: 16, color: 'var(--hc-muted, #aaa)', maxWidth: 640, margin: '0 auto 32px' }}>
                    Haul Command is the only platform that verifies escort operators against real permit corridors, live GPS breadcrumbs, and 5-axis trust scores — coast to coast.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/directory/us" style={primaryBtn}>Browse Full Directory</Link>
                    <Link href="/loads" style={secondaryBtn}>View Open Loads</Link>
                </div>
            </section>

            {/* Interactive map */}
            <section style={{ marginBottom: 56 }}>
                <h2 style={sectionHeading}>Click Your State</h2>
                <HubMap country="us" />
            </section>

            {/* Top state cards */}
            <section style={{ marginBottom: 56 }}>
                <h2 style={sectionHeading}>Top Markets</h2>
                <StateButtonGrid>
                    {TOP_STATES.map(({ code, label, emoji, note }) => (
                        <StateButton
                            key={code}
                            href={`/directory/us/${code}`}
                            emoji={emoji}
                            label={label}
                            sublabel={note}
                        />
                    ))}
                </StateButtonGrid>
            </section>

            {/* CTA */}
            <section style={{ marginBottom: 48 }}>
                <GatedCTA mode="live" headline="Join the US Haul Command Network" />
            </section>

            {/* SEO copy */}
            <section style={{ borderTop: '1px solid var(--hc-border, #222)', paddingTop: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                    About US Pilot Car Regulations
                </h2>
                <p style={{ fontSize: 14, color: 'var(--hc-muted, #aaa)', lineHeight: 1.7, maxWidth: 700 }}>
                    Every US state sets its own escort vehicle requirements for oversize loads. Haul Command tracks
                    permit rules, reciprocity agreements, and driver certification standards across all 50 states so
                    you never run blind into a curfew or a credentialing mismatch. Browse by state or{' '}
                    <Link href="/regulatory-db" style={{ color: '#d97706' }}>search the regulatory database</Link>.
                </p>
            </section>
        </main>
    );
}

const primaryBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #f5b942, #d97706)',
    color: '#0a0f16',
    fontWeight: 900,
    fontSize: 13,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderRadius: 10,
    textDecoration: 'none',
    boxShadow: '0 3px 16px rgba(245,185,66,0.28)',
};

const secondaryBtn: React.CSSProperties = {
    display: 'inline-block',
    padding: '12px 20px',
    background: '#121a24',
    color: '#e6edf3',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    textDecoration: 'none',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
};

const sectionHeading: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: '#ffffff',
    letterSpacing: '0.02em',
};

// stateCard kept for any legacy inline use (prefer StateButton)
const stateCard: React.CSSProperties = {
    display: 'block',
    minHeight: 56,
    padding: '14px 16px',
    background: '#121a24',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    textDecoration: 'none',
    color: '#e6edf3',
    transition: 'all 160ms ease',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
};
