import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, MapPin, TrendingUp, Users, Shield, Truck } from 'lucide-react';
import { SchemaGenerator } from '@/components/seo/SchemaGenerator';
import type { Metadata } from 'next';

// Major US highways with data
const HWY_DATA: Record<string, { name: string; states: string[]; description: string }> = {
    'i10': { name: 'Interstate 10', states: ['CA', 'AZ', 'NM', 'TX', 'LA', 'MS', 'AL', 'FL'], description: 'Southern transcontinental corridor from Jacksonville to Los Angeles' },
    'i20': { name: 'Interstate 20', states: ['TX', 'LA', 'MS', 'AL', 'GA', 'SC'], description: 'Southern east-west corridor from Florence to Kent' },
    'i35': { name: 'Interstate 35', states: ['TX', 'OK', 'KS', 'MO', 'IA', 'MN'], description: 'Central north-south corridor from Laredo to Duluth' },
    'i40': { name: 'Interstate 40', states: ['CA', 'AZ', 'NM', 'TX', 'OK', 'AR', 'TN', 'NC'], description: 'Major east-west transcontinental corridor' },
    'i70': { name: 'Interstate 70', states: ['UT', 'CO', 'KS', 'MO', 'IL', 'IN', 'OH', 'WV', 'PA', 'MD'], description: 'Central east-west corridor from Cove Fort to Baltimore' },
    'i75': { name: 'Interstate 75', states: ['FL', 'GA', 'TN', 'KY', 'OH', 'MI'], description: 'Major north-south from Miami to Sault Ste. Marie' },
    'i80': { name: 'Interstate 80', states: ['CA', 'NV', 'UT', 'WY', 'NE', 'IA', 'IL', 'IN', 'OH', 'PA', 'NJ'], description: 'Northern transcontinental corridor' },
    'i90': { name: 'Interstate 90', states: ['WA', 'ID', 'MT', 'WY', 'SD', 'MN', 'WI', 'IL', 'IN', 'OH', 'PA', 'NY', 'MA'], description: 'Longest Interstate from Seattle to Boston' },
    'i95': { name: 'Interstate 95', states: ['FL', 'GA', 'SC', 'NC', 'VA', 'DC', 'MD', 'DE', 'PA', 'NJ', 'NY', 'CT', 'RI', 'MA', 'NH', 'ME'], description: 'East Coast corridor from Miami to Houlton' },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const hwy = HWY_DATA[params.highway] ?? { name: params.highway.toUpperCase(), states: [], description: '' };
    const st = params.state.toUpperCase();
    return {
        title: `Pilot Car Services on ${hwy.name} in ${st} | Haul Command`,
        description: `Find verified pilot car and escort vehicle services along ${hwy.name} through ${st}. Live driver availability, historical lane rates, and permit complexity data.`,
        keywords: [`pilot car ${hwy.name}`, `escort vehicle ${st}`, `oversize load escort ${hwy.name} ${st}`, `wide load escort ${st}`],
    };
}

export default async function CorridorPage({ params }: any) {
    const supabase = supabaseServer();
    const hwy = HWY_DATA[params.highway] ?? { name: params.highway.toUpperCase(), states: [params.state.toUpperCase()], description: 'Highway corridor' };
    const st = params.state.toUpperCase();

    // Fetch corridor stats
    const { data: stats } = await supabase.from('seo_region_stats').select('*').eq('region_code', st).single();
    const { data: cities } = await supabase.from('seo_market_pulse').select('*').eq('region_code', st).order('total_providers', { ascending: false }).limit(12);

    return (
        <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Breadcrumbs */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                    <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <Link href={`/routes/${params.highway}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{hwy.name}</Link>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                    <span style={{ color: '#d1d5db' }}>{st}</span>
                </nav>

                {/* Hero */}
                <header style={{ marginBottom: 48 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                        <Truck style={{ width: 12, height: 12, color: '#F1A91B' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Corridor Intelligence</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f9fafb', letterSpacing: -1, lineHeight: 1.1 }}>
                        Pilot Car Services on <span style={{ color: '#F1A91B' }}>{hwy.name}</span>
                    </h1>
                    <h2 style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: '#6b7280' }}>
                        Through {st} — {hwy.description}
                    </h2>
                </header>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
                    {[
                        { label: 'Verified Escorts', val: stats?.total_providers ?? 0, icon: Users, color: '#f9fafb' },
                        { label: 'Active Cities', val: cities?.length ?? 0, icon: MapPin, color: '#F1A91B' },
                        { label: 'Trust Index', val: `${stats?.region_trust_index ?? 0}%`, icon: Shield, color: '#10b981' },
                        { label: 'States Connected', val: hwy.states.length, icon: TrendingUp, color: '#3b82f6' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem', textAlign: 'center' }}>
                            <s.icon style={{ width: 16, height: 16, color: s.color, margin: '0 auto 8px' }} />
                            <div style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.val}</div>
                            <div style={{ fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Route States */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Full {hwy.name} Corridor</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {hwy.states.map((s, i) => (
                            <Link key={s} href={`/routes/${params.highway}/${s.toLowerCase()}`} style={{
                                padding: '6px 16px', borderRadius: 10, textDecoration: 'none',
                                background: s === st ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${s === st ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                color: s === st ? '#F1A91B' : '#6b7280', fontSize: 12, fontWeight: 700,
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {s}
                                {i < hwy.states.length - 1 && <span style={{ color: '#4b5563' }}>→</span>}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* City Nodes Along Corridor */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Major City Nodes in {st}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                        {(cities ?? []).map((c: any) => (
                            <Link key={c.city} href={`/directory/us/${st.toLowerCase()}/${c.city.toLowerCase().replace(/\s+/g, '-')}`} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderRadius: 12, textDecoration: 'none',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                transition: 'all 0.2s',
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>{c.city}</div>
                                    <div style={{ fontSize: 10, color: '#6b7280' }}>{c.total_providers} escorts</div>
                                </div>
                                <ChevronRight style={{ width: 14, height: 14, color: '#4b5563' }} />
                            </Link>
                        ))}
                    </div>
                </section>

                {/* FAQ Section (Schema.org) */}
                <section style={{ marginBottom: 32 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Frequently Asked Questions</h3>
                    {[
                        { q: `Do I need a pilot car on ${hwy.name} in ${st}?`, a: `Most oversize loads traveling on ${hwy.name} through ${st} require at least one pilot car. Loads exceeding 12\' wide typically require two escorts. Check ${st}\'s DOT requirements for exact thresholds.` },
                        { q: `How much do pilot car services cost on ${hwy.name}?`, a: `Rates vary by distance, load dimensions, and urgency. Typical rates on this corridor range from $300-$800 per escort vehicle per day. Use our free Rate Lookup tool for current market data.` },
                        { q: `How quickly can I find an escort on ${hwy.name}?`, a: `Haul Command\'s median fill time is 47 minutes. With ${stats?.total_providers ?? 0} verified escorts in ${st}, most loads fill within 2 hours on this corridor.` },
                    ].map((faq, i) => (
                        <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8 }}>
                            <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#d1d5db' }}>{faq.q}</h4>
                            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{faq.a}</p>
                        </div>
                    ))}
                    {/* FAQ Schema */}
                    <script type="application/ld+json" dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org", "@type": "FAQPage",
                            "mainEntity": [
                                { "@type": "Question", "name": `Do I need a pilot car on ${hwy.name} in ${st}?`, "acceptedAnswer": { "@type": "Answer", "text": `Most oversize loads on ${hwy.name} through ${st} require at least one pilot car.` } },
                                { "@type": "Question", "name": `How much do pilot car services cost on ${hwy.name}?`, "acceptedAnswer": { "@type": "Answer", "text": `Typical rates range from $300-$800 per escort vehicle per day on this corridor.` } },
                            ]
                        })
                    }} />
                </section>

                {/* CTA */}
                <div style={{ background: 'linear-gradient(135deg, rgba(241,169,27,0.08), rgba(241,169,27,0.02))', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, padding: '2rem', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Running the {hwy.name} corridor?</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>Post your load and get matched with verified escorts along this route in minutes.</p>
                    <Link href="/loads/post" style={{ display: 'inline-flex', padding: '10px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, textDecoration: 'none' }}>Post a Load →</Link>
                </div>
            </div>
        </div>
    );
}
