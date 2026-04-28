import type { Metadata } from 'next';
import Link from 'next/link';
import FoundingSponsorCheckout from './_components/FoundingSponsorCheckout';

export const metadata: Metadata = {
    title: 'Founding Sponsor | Haul Command',
    description: 'Become a Founding Sponsor of Haul Command — the global heavy haul operating system. Early adopter pricing, permanent badge, directory priority, and corridor visibility.',
    alternates: { canonical: 'https://www.haulcommand.com/advertise/founding-sponsor' },
};

const PACKAGES = [
    {
        id: 'founding_bronze',
        priceKey: 'founding_sponsor_bronze',
        name: 'Bronze Sponsor',
        price: '$299',
        period: 'one-time',
        color: '#CD7F32',
        features: [
            '3-month featured badge on your profile',
            'Corridor placement on 1 active corridor',
            'Listed in Founding Sponsors registry',
            'Name/logo in newsletter (1 send)',
            'Standard directory boost',
        ],
        note: 'Lock in early-adopter status. Price increases as platform grows.',
        successPath: '/dashboard/operator?sponsor=bronze',
    },
    {
        id: 'founding_silver',
        priceKey: 'founding_sponsor_silver',
        name: 'Silver Sponsor',
        price: '$799',
        period: 'one-time',
        color: '#C0C0C0',
        highlight: true,
        features: [
            '6-month featured badge — Priority position in search',
            'Corridor placement on 3 corridors of your choice',
            'State territory sponsorship for 1 US state (6 months)',
            'Featured in Founding Sponsors registry (logo + description)',
            'Newsletter feature (3 sends)',
            'Access to beta features before public release',
        ],
        note: 'Best value for established operators and carriers expanding coverage.',
        successPath: '/dashboard/operator?sponsor=silver',
    },
    {
        id: 'founding_gold',
        priceKey: 'founding_sponsor_gold',
        name: 'Gold Sponsor',
        price: '$1,499',
        period: 'one-time',
        color: '#F1A91B',
        features: [
            '12-month Gold badge — permanent Founding Sponsor status',
            'Corridor placement on all corridors in your region',
            'Territory sponsorship for 1 US state — 12 months',
            'Homepage featured placement (rotating)',
            'Category owner badge: your niche in the directory',
            'Data access: monthly corridor demand + operator density report',
            'Dedicated onboarding call',
            'Founding Sponsor logo wall placement',
        ],
        note: 'Full visibility across Haul Command for 12 months. Price never increases for Founding Sponsors.',
        successPath: '/dashboard/operator?sponsor=gold',
    },
];

export default function FoundingSponsorPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#090706', color: '#E5E7EB', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)" }}>
            {/* Hero */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '4px 14px', borderRadius: 999,
                    background: 'rgba(241,169,27,0.10)', border: '1px solid rgba(241,169,27,0.30)',
                    color: '#F1A91B', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20,
                }}>
                    Early Adopter Opportunity
                </div>
                <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 16 }}>
                    Become a Founding Sponsor
                </h1>
                <p style={{ fontSize: 16, color: '#9CA3AF', maxWidth: 600, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                    Haul Command is building the global operating system for heavy haul. Founding Sponsors lock in early pricing,
                    get permanent visibility, and help establish the platform that the industry will rely on.
                </p>
                <p style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                    One-time payment. No recurring charges. Price grandfathered for Founding Sponsors as platform grows.
                </p>
            </section>

            {/* What you&apos;re buying into */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 2rem' }}>
                <div style={{
                    background: 'rgba(241,169,27,0.05)', border: '1px solid rgba(241,169,27,0.20)',
                    borderRadius: 16, padding: '1.5rem',
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16,
                }}>
                    {[
                        { value: '7,700+', label: 'Operators indexed' },
                        { value: '120', label: 'Countries in registry' },
                        { value: '51', label: 'Active corridors' },
                        { value: 'Growing', label: 'New listings daily' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#F1A91B' }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Packages */}
            <section style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                    {PACKAGES.map(pkg => (
                        <div key={pkg.id} style={{
                            background: pkg.highlight ? 'rgba(241,169,27,0.06)' : '#111114',
                            border: pkg.highlight ? '2px solid rgba(241,169,27,0.35)' : '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: '28px 24px',
                            display: 'flex', flexDirection: 'column',
                            position: 'relative',
                            transform: pkg.highlight ? 'scale(1.02)' : 'none',
                        }}>
                            {pkg.highlight && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: '#F1A91B', color: '#000', fontSize: 10, fontWeight: 900,
                                    letterSpacing: '0.1em', padding: '4px 16px', borderRadius: 6,
                                    whiteSpace: 'nowrap',
                                }}>MOST POPULAR</div>
                            )}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: pkg.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {pkg.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span style={{ fontSize: 36, fontWeight: 900, color: '#F9FAFB' }}>{pkg.price}</span>
                                    <span style={{ fontSize: 13, color: '#6B7280' }}>{pkg.period}</span>
                                </div>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                                {pkg.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#D1D5DB', marginBottom: 10 }}>
                                        <span style={{ color: '#F1A91B', flexShrink: 0, marginTop: 2 }}>✓</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <p style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>
                                {pkg.note}
                            </p>
                            <FoundingSponsorCheckout
                                priceKey={pkg.priceKey}
                                label={`Get ${pkg.name}`}
                                color={pkg.color}
                                successPath={pkg.successPath}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Manual / enterprise option */}
            <section style={{ maxWidth: 700, margin: '0 auto', padding: '0 1.5rem 4rem', textAlign: 'center' }}>
                <div style={{
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.5rem',
                }}>
                    <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 12 }}>
                        Looking for multi-state coverage, white-label placement, or custom packages?
                    </p>
                    <Link href="mailto:sponsorship@haulcommand.com?subject=Founding Sponsor Custom Package" style={{
                        display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                        border: '1px solid rgba(241,169,27,0.3)', color: '#F1A91B',
                        fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    }}>
                        Contact Us for Custom Package →
                    </Link>
                </div>
            </section>
        </div>
    );
}
