import Link from 'next/link';
import { Shield, Clock, Truck, ChevronRight, MapPin, AlertTriangle } from 'lucide-react';
import type { Metadata } from 'next';

const CROSSINGS: Record<string, { name: string; us_state: string; ca_province: string; type: string; hours: string; escort_required: boolean; twic: boolean; notes: string }> = {
    'ambassador-bridge': { name: 'Ambassador Bridge', us_state: 'MI', ca_province: 'ON', type: 'Bridge', hours: '24/7 Commercial', escort_required: true, twic: false, notes: 'Oversize loads require advance booking. Max height 13\'6". Escort both sides.' },
    'peace-bridge': { name: 'Peace Bridge', us_state: 'NY', ca_province: 'ON', type: 'Bridge', hours: '24/7', escort_required: true, twic: false, notes: 'Overweight permits required. Canadian escort must relay at border.' },
    'blue-water-bridge': { name: 'Blue Water Bridge', us_state: 'MI', ca_province: 'ON', type: 'Bridge', hours: '24/7', escort_required: true, twic: false, notes: 'Dual spans. Oversize restricted to off-peak hours.' },
    'laredo': { name: 'Laredo (World Trade Bridge)', us_state: 'TX', ca_province: '', type: 'Land', hours: '6AM-12AM', escort_required: false, twic: false, notes: 'Heavy haul corridor to Mexico. US escort to border.' },
    'detroit-windsor': { name: 'Detroit-Windsor Tunnel', us_state: 'MI', ca_province: 'ON', type: 'Tunnel', hours: 'Restricted oversize', escort_required: true, twic: false, notes: 'No oversize loads through tunnel. Use Ambassador Bridge.' },
    'sweetgrass-coutts': { name: 'Sweetgrass-Coutts', us_state: 'MT', ca_province: 'AB', type: 'Land', hours: '24/7', escort_required: true, twic: false, notes: 'Major wind turbine corridor. Alberta and Montana escorts required.' },
    'pacific-highway': { name: 'Pacific Highway', us_state: 'WA', ca_province: 'BC', type: 'Land', hours: '24/7', escort_required: true, twic: false, notes: 'BC pilot car certification required on Canadian side.' },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const crossing = CROSSINGS[params['crossing-name']] ?? { name: params['crossing-name'].replace(/-/g, ' ') };
    return {
        title: `Escort Services at ${crossing.name} Border Crossing | Haul Command`,
        description: `Find verified escort vehicle services at ${crossing.name}. Commercial hours, escort requirements, cross-border rules, and nearby drivers.`,
    };
}

export default function BorderCrossingPage({ params }: any) {
    const slug = params['crossing-name'];
    const crossing = CROSSINGS[slug] ?? { name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), us_state: '', ca_province: '', type: 'Land', hours: 'Check locally', escort_required: true, twic: false, notes: '' };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <Link href="/border" style={{ color: '#6b7280', textDecoration: 'none' }}>Border Crossings</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{crossing.name}</span>
                </nav>

                <header style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 2 }}>🌐 Cross-Border</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>
                        Escort Services at <span style={{ color: '#F1A91B' }}>{crossing.name}</span>
                    </h1>
                    {crossing.us_state && crossing.ca_province && (
                        <p style={{ margin: '8px 0 0', fontSize: 15, color: '#6b7280' }}>{crossing.us_state}, US ↔ {crossing.ca_province}, Canada</p>
                    )}
                </header>

                {/* Info cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
                    {[
                        { icon: Clock, label: 'Hours', val: crossing.hours, color: '#3b82f6' },
                        { icon: Truck, label: 'Type', val: crossing.type, color: '#F1A91B' },
                        { icon: Shield, label: 'Escort Req', val: crossing.escort_required ? 'Yes' : 'Check', color: crossing.escort_required ? '#ef4444' : '#10b981' },
                        { icon: AlertTriangle, label: 'TWIC', val: crossing.twic ? 'Required' : 'Not Required', color: '#6b7280' },
                    ].map(c => (
                        <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                            <c.icon style={{ width: 14, height: 14, color: c.color, margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.val}</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>{c.label}</div>
                        </div>
                    ))}
                </div>

                {crossing.notes && (
                    <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '1rem', marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>⚠ Important Notes</div>
                        <p style={{ margin: 0, fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>{crossing.notes}</p>
                    </div>
                )}

                {/* Other crossings */}
                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>All Border Crossings</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                        {Object.entries(CROSSINGS).map(([s, c]) => (
                            <Link key={s} href={`/border/${s}/escort-services`} style={{
                                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                                background: s === slug ? 'rgba(241,169,27,0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${s === slug ? 'rgba(241,169,27,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                color: s === slug ? '#F1A91B' : '#9ca3af', fontSize: 12, fontWeight: 600,
                            }}>{c.name}</Link>
                        ))}
                    </div>
                </section>

                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Need a cross-border escort?</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Find verified escorts on both sides of the border.</p>
                    <Link href="/loads/post" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>Post Cross-Border Load →</Link>
                </div>
            </div>
        </div>
    );
}
