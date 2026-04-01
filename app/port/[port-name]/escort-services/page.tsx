import Link from 'next/link';
import { ChevronRight, Anchor, Shield, Clock, Truck } from 'lucide-react';
import type { Metadata } from 'next';

const PORTS: Record<string, { name: string; state: string; twic: boolean; heavyFreq: string; notes: string }> = {
    'houston': { name: 'Port of Houston', state: 'TX', twic: true, heavyFreq: 'Very High', notes: 'Major petrochemical and heavy equipment hub. TWIC required for all port access.' },
    'long-beach': { name: 'Port of Long Beach', state: 'CA', twic: true, heavyFreq: 'Very High', notes: 'Largest container port. Frequent oversize loads. Night moves preferred.' },
    'savannah': { name: 'Port of Savannah', state: 'GA', twic: true, heavyFreq: 'High', notes: 'Fastest growing US port. Heavy equipment and project cargo.' },
    'norfolk': { name: 'Port of Norfolk', state: 'VA', twic: true, heavyFreq: 'High', notes: 'Military and commercial port. Security clearance for some loads.' },
    'new-orleans': { name: 'Port of New Orleans', state: 'LA', twic: true, heavyFreq: 'High', notes: 'Mississippi River port. Heavy petrochemical equipment moves.' },
    'mobile': { name: 'Port of Mobile', state: 'AL', twic: true, heavyFreq: 'Moderate', notes: 'Growing container terminal. Aerospace and energy cargo.' },
    'tampa': { name: 'Port of Tampa', state: 'FL', twic: true, heavyFreq: 'Moderate', notes: 'Bulk cargo and project freight. Escort during non-peak hours.' },
    'seattle': { name: 'Port of Seattle', state: 'WA', twic: true, heavyFreq: 'High', notes: 'Pacific trade gateway. Wind energy and construction equipment.' },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const port = PORTS[params['port-name']] ?? { name: params['port-name'].replace(/-/g, ' ') };
    return {
        title: `Escort Services at ${port.name} | Haul Command`,
        description: `Find verified pilot car and escort vehicle services at ${port.name}. TWIC status, heavy haul frequency, port access details, and nearby verified drivers.`,
    };
}

export default function PortPage({ params }: any) {
    const slug = params['port-name'];
    const port = PORTS[slug] ?? { name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), state: '', twic: true, heavyFreq: 'Unknown', notes: '' };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <Link href="/port" style={{ color: '#6b7280', textDecoration: 'none' }}>Ports</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{port.name}</span>
                </nav>

                <header style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <Anchor style={{ width: 12, height: 12, color: '#818cf8' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 2 }}>Port Access</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5 }}>
                        Escort Services at <span style={{ color: '#F1A91B' }}>{port.name}</span>
                    </h1>
                    {port.state && <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>{port.state}</p>}
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                        <Shield style={{ width: 14, height: 14, color: port.twic ? '#ef4444' : '#10b981', margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 14, fontWeight: 800, color: port.twic ? '#ef4444' : '#10b981' }}>{port.twic ? 'Required' : 'Not Required'}</div>
                        <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>TWIC Card</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                        <Truck style={{ width: 14, height: 14, color: '#F1A91B', margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#F1A91B' }}>{port.heavyFreq}</div>
                        <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>Heavy Haul Freq</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1rem', textAlign: 'center' }}>
                        <Anchor style={{ width: 14, height: 14, color: '#818cf8', margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#818cf8' }}>{port.state}</div>
                        <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>State</div>
                    </div>
                </div>

                {port.notes && (
                    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '1rem', marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📋 Port Notes</div>
                        <p style={{ margin: 0, fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>{port.notes}</p>
                    </div>
                )}

                {/* All ports */}
                <section style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>All Ports</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                        {Object.entries(PORTS).map(([s, p]) => (
                            <Link key={s} href={`/port/${s}/escort-services`} style={{
                                padding: '10px 14px', borderRadius: 10, textDecoration: 'none',
                                background: s === slug ? 'rgba(241,169,27,0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${s === slug ? 'rgba(241,169,27,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                color: s === slug ? '#F1A91B' : '#9ca3af', fontSize: 12, fontWeight: 600,
                            }}>{p.name}</Link>
                        ))}
                    </div>
                </section>

                <div style={{ background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Need port escort services?</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Match with TWIC-verified escorts near {port.name}.</p>
                    <Link href="/loads/post" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>Post Port Load →</Link>
                </div>
            </div>
        </div>
    );
}
