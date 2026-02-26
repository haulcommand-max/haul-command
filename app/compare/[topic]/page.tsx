import Link from 'next/link';
import type { Metadata } from 'next';

const TOPICS: Record<string, { title: string; meta: string; sections: { heading: string; left: { label: string; points: string[] }; right: { label: string; points: string[] } }[] }> = {
    'pilot-car-vs-police-escort': {
        title: 'Pilot Car vs Police Escort',
        meta: 'Should you use a pilot car or police escort for your oversize load? Compare cost, availability, requirements, and when each is needed.',
        sections: [
            {
                heading: 'Cost', left: { label: 'Pilot Car', points: ['$300–$800/day', 'Negotiable rates', 'No hourly minimums typical', 'Per-mile options available'] },
                right: { label: 'Police Escort', points: ['$500–$1,500/day', 'Fixed rates set by department', 'Often 4-hour minimums', 'Weekend/holiday surcharges'] }
            },
            {
                heading: 'Availability', left: { label: 'Pilot Car', points: ['Available 24/7 via platforms', 'Median fill: 47 min', 'Nationwide network', 'App-based booking'] },
                right: { label: 'Police Escort', points: ['Business hours preferred', 'Often 2-5 day advance booking', 'Limited to jurisdiction', 'Phone/fax booking'] }
            },
            {
                heading: 'When Required', left: { label: 'Pilot Car', points: ['All oversize loads', 'Front/rear positioning varies', 'Required by nearly all states', 'Can cross state lines'] },
                right: { label: 'Police Escort', points: ['Superloads only (most states)', 'Certain urban zones', 'Bridge/interchange crossings', 'State DOT mandated routes'] }
            },
        ]
    },
    'escort-vehicle-requirements-by-state': {
        title: 'Escort Vehicle Requirements by State',
        meta: 'Compare escort vehicle requirements across all 50 states: certification, equipment, insurance, and width thresholds.',
        sections: [
            {
                heading: 'Certification', left: { label: 'States WITH Certification', points: ['TX, OH, CA, FL, GA, IL, PA', 'Online courses: $50-$150', 'Renewal every 2-4 years', 'Some accept reciprocity'] },
                right: { label: 'States WITHOUT Certification', points: ['MT, WY, SD, ND, VT, NH', 'General driver requirements only', 'Insurance still required', 'Carrier-enforced standards'] }
            },
            {
                heading: 'Equipment Standards', left: { label: 'Most Strict', points: ['Height pole required (most)', 'Roof-mounted amber lights bar', 'Front+Rear oversize signs', 'CB radio + cell phone'] },
                right: { label: 'Minimum Standard', points: ['Amber light (dash ok in some)', 'Basic oversize banner', 'Communication device', 'Clean driving record'] }
            },
        ]
    },
};

export async function generateMetadata({ params }: any): Promise<Metadata> {
    const topic = TOPICS[params.topic];
    return {
        title: `${topic?.title ?? 'Comparison'} | Haul Command`,
        description: topic?.meta ?? 'Compare pilot car and escort vehicle services.',
    };
}

export default function ComparisonPage({ params }: any) {
    const topic = TOPICS[params.topic];
    if (!topic) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Comparison not found.</div>;

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h1 style={{ margin: '0 0 32px', fontSize: 32, fontWeight: 900, color: '#f9fafb', textAlign: 'center', letterSpacing: -0.5 }}>{topic.title}</h1>

                {topic.sections.map((sec, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>{sec.heading}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[sec.left, sec.right].map((side, si) => (
                                <div key={si} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '1.25rem' }}>
                                    <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 800, color: si === 0 ? '#F1A91B' : '#3b82f6' }}>{side.label}</h3>
                                    <ul style={{ margin: 0, paddingLeft: 16, listStyleType: '\'→ \'' }}>
                                        {side.points.map((p, pi) => (
                                            <li key={pi} style={{ fontSize: 12, color: '#d1d5db', lineHeight: 2 }}>{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Other comparisons */}
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>More Comparisons</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.entries(TOPICS).map(([slug, t]) => (
                            <Link key={slug} href={`/compare/${slug}`} style={{
                                padding: '6px 14px', borderRadius: 8, textDecoration: 'none',
                                background: slug === params.topic ? 'rgba(241,169,27,0.1)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${slug === params.topic ? 'rgba(241,169,27,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                color: slug === params.topic ? '#F1A91B' : '#6b7280', fontSize: 11, fontWeight: 700,
                            }}>{t.title}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
