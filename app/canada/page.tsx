import type { Metadata } from 'next';
import { HubMap } from '@/components/ui/HubMap';
import { GatedCTA } from '@/components/ui/GatedCTA';
import { StateButton, StateButtonGrid } from '@/components/ui/StateButton';
import Link from 'next/link';


export const metadata: Metadata = {
    title: 'Pilot Car Services in Canada | Haul Command',
    description: 'Find verified pilot car and escort vehicle operators across all Canadian provinces. Real-time availability, trust scores, and corridor intelligence — powered by Haul Command.',
    openGraph: {
        title: 'Pilot Car Services in Canada | Haul Command',
        description: 'Verified pilot car operators in all Canadian provinces. Click your province to search.',
        url: 'https://haulcommand.com/canada',
    },
};

const TOP_PROVINCES = [
    { code: 'ab', label: 'Alberta', emoji: '🛢️', note: 'Oil sands + pipeline ops' },
    { code: 'bc', label: 'British Columbia', emoji: '🌲', note: 'Port of Vancouver gateway' },
    { code: 'on', label: 'Ontario', emoji: '🏭', note: 'Highway 400 corridor' },
    { code: 'qc', label: 'Québec', emoji: '⚜️', note: 'A-20/A-40 logistics spine' },
    { code: 'sk', label: 'Saskatchewan', emoji: '🌾', note: 'Ag equipment season' },
    { code: 'mb', label: 'Manitoba', emoji: '🦌', note: 'Trans-Canada crossroads' },
];

export default function CanadaPage() {
    return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
            {/* Hero */}
            <section style={{ textAlign: 'center', marginBottom: 48 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', color: '#d97706', textTransform: 'uppercase', marginBottom: 12 }}>
                    🍁 Canada Directory
                </div>
                <h1 style={{ fontSize: 'clamp(28px,5vw,46px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
                    Pilot Car Services Across Canada
                </h1>
                <p style={{ fontSize: 16, color: 'var(--hc-muted, #aaa)', maxWidth: 640, margin: '0 auto 32px' }}>
                    From the Bakken fields of Alberta to the Port of Prince Rupert, Haul Command connects heavy haul brokers with verified Canadian escort operators — province by province.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/directory/ca" style={primaryBtn}>Browse Canadian Directory</Link>
                    <Link href="/regulatory-db" style={secondaryBtn}>Provincial Requirements</Link>
                </div>
            </section>

            {/* Interactive map */}
            <section style={{ marginBottom: 56 }}>
                <h2 style={sectionHeading}>Click Your Province</h2>
                <HubMap country="ca" />
            </section>

            {/* Province cards */}
            <section style={{ marginBottom: 56 }}>
                <h2 style={sectionHeading}>Top Markets</h2>
                <StateButtonGrid>
                    {TOP_PROVINCES.map(({ code, label, emoji, note }) => (
                        <StateButton
                            key={code}
                            href={`/directory/ca/${code}`}
                            emoji={emoji}
                            label={label}
                            sublabel={note}
                        />
                    ))}
                </StateButtonGrid>
            </section>

            {/* Cross-border note */}
            <section style={{ marginBottom: 40, padding: '20px 24px', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🔁 Cross-Border Loads</h3>
                <p style={{ fontSize: 13, color: 'var(--hc-muted, #aaa)', margin: 0, lineHeight: 1.6 }}>
                    Running a US–Canada cross-border load? Haul Command tracks CBSA crossing requirements and can match you with operators licensed in both countries.{' '}
                    <Link href="/border" style={{ color: '#d97706' }}>View border crossing protocols →</Link>
                </p>
            </section>

            {/* CTA */}
            <section style={{ marginBottom: 48 }}>
                <GatedCTA mode="live" headline="Join the Canadian Haul Command Network" />
            </section>

            {/* SEO copy */}
            <section style={{ borderTop: '1px solid var(--hc-border, #222)', paddingTop: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
                    Canadian Pilot Car Regulations
                </h2>
                <p style={{ fontSize: 14, color: 'var(--hc-muted, #aaa)', lineHeight: 1.7, maxWidth: 700 }}>
                    Each Canadian province regulates oversize vehicle escorts independently. Alberta, BC, and Saskatchewan
                    maintain their own escort vehicle certification programs. Quebec requires certified accompanateurs
                    for loads exceeding provincial oversize thresholds. Haul Command tracks all provincial requirements
                    and reciprocity agreements.{' '}
                    <Link href="/regulatory-db?country=ca" style={{ color: '#d97706' }}>Browse the Canadian regulatory database →</Link>
                </p>
            </section>
        </main>
    );
}

const primaryBtn: React.CSSProperties = {
    display: 'inline-block', padding: '12px 24px',
    background: 'linear-gradient(135deg, #f5b942, #d97706)',
    color: '#0a0f16', fontWeight: 900, fontSize: 13,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', borderRadius: 10, textDecoration: 'none',
    boxShadow: '0 3px 16px rgba(245,185,66,0.28)',
};
const secondaryBtn: React.CSSProperties = {
    display: 'inline-block', padding: '12px 20px',
    background: '#121a24', color: '#e6edf3', fontWeight: 700, fontSize: 13,
    borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
    textDecoration: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
};
const sectionHeading: React.CSSProperties = {
    fontSize: 20, fontWeight: 700, marginBottom: 20,
    color: '#ffffff', letterSpacing: '0.02em',
};
const provinceCard: React.CSSProperties = {
    display: 'block', minHeight: 56, padding: '14px 16px',
    background: '#121a24', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, textDecoration: 'none', color: '#e6edf3',
    transition: 'all 160ms ease', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
};
