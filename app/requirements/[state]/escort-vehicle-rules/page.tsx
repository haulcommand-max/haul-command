import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { SnippetInjector } from '@/components/seo/SnippetInjector';

interface Props {
    params: Promise<{ state: string }>;
}

// State data — same source of truth as state-requirements tool
const STATE_DATA: Record<string, {
    name: string; cert: boolean; heightPole: boolean; insurance: string;
    escort1: string; escort2: string; night: string; notes: string;
    dotLink?: string; certBody?: string;
}> = {
    tx: { name: 'Texas', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "16'", night: 'Restricted', notes: 'TX pilot car certification required', dotLink: 'https://www.txdot.gov', certBody: 'TxDOT' },
    fl: { name: 'Florida', cert: true, heightPole: true, insurance: '$300K', escort1: "12'", escort2: "14.6'", night: 'Restricted', notes: 'FDOT permit required for each move', dotLink: 'https://www.fdot.gov', certBody: 'FDOT' },
    ca: { name: 'California', cert: true, heightPole: true, insurance: '$1M', escort1: "12'", escort2: "14'", night: 'No', notes: 'Caltrans certification, no night superloads', dotLink: 'https://dot.ca.gov', certBody: 'Caltrans' },
    oh: { name: 'Ohio', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "14'", night: 'Some', notes: 'ODOT-approved pilot car operator course', dotLink: 'https://www.transportation.ohio.gov', certBody: 'ODOT' },
    pa: { name: 'Pennsylvania', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "16'", night: 'No', notes: 'PennDOT escort rules, no superload night moves', dotLink: 'https://www.penndot.pa.gov', certBody: 'PennDOT' },
    ga: { name: 'Georgia', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "14'", night: 'Restricted', notes: 'GDOT online certification accepted', dotLink: 'https://gdot.ga.gov', certBody: 'GDOT' },
    il: { name: 'Illinois', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "15'", night: 'Some', notes: 'IDOT permit, special bridge restrictions', dotLink: 'https://idot.illinois.gov', certBody: 'IDOT' },
    ny: { name: 'New York', cert: false, heightPole: true, insurance: '$1M', escort1: "12'", escort2: "14'", night: 'Restricted', notes: 'No state cert but carrier standards apply', dotLink: 'https://www.dot.ny.gov', certBody: 'NYSDOT' },
    la: { name: 'Louisiana', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "14'", night: 'Restricted', notes: 'DOTD pilot vehicle operator cert', dotLink: 'https://dotd.la.gov', certBody: 'DOTD' },
    ok: { name: 'Oklahoma', cert: true, heightPole: true, insurance: '$300K', escort1: "12'", escort2: "14'", night: 'Yes', notes: 'TX reciprocity accepted', dotLink: 'https://www.odot.org', certBody: 'ODOT' },
    mt: { name: 'Montana', cert: false, heightPole: true, insurance: '$300K', escort1: "12'", escort2: "16'", night: 'Yes', notes: 'No state cert, wind turbine corridor', dotLink: 'https://www.mdt.mt.gov', certBody: 'MDT' },
    wa: { name: 'Washington', cert: true, heightPole: true, insurance: '$500K', escort1: "12'", escort2: "14'", night: 'Restricted', notes: 'WSDOT pilot car certification', dotLink: 'https://www.wsdot.wa.gov', certBody: 'WSDOT' },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { state } = await params;
    const s = STATE_DATA[state.toLowerCase()];
    if (!s) return { title: 'Not Found' };
    return {
        title: `${s.name} Escort Vehicle Rules & Pilot Car Requirements | Haul Command`,
        description: `Complete guide to pilot car certification, escort requirements, insurance minimums, and night travel rules in ${s.name}. Updated ${new Date().getFullYear()}.`,
        alternates: { canonical: `https://www.haulcommand.com/requirements/${state.toLowerCase()}/escort-vehicle-rules` },
    };
}

export default async function StateEscortRulesPage({ params }: Props) {
    const { state } = await params;
    const s = STATE_DATA[state.toLowerCase()];
    if (!s) return notFound();

    const requiresPluralEscorts = parseInt(s.escort2) > parseInt(s.escort1);

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0', fontFamily: "'Inter', system-ui" }}>

            {/* Schema */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Article',
                name: `${s.name} Pilot Car & Escort Vehicle Requirements`,
                description: `Escort vehicle rules, certification requirements, and insurance minimums for ${s.name}`,
                url: `https://www.haulcommand.com/requirements/${state.toLowerCase()}/escort-vehicle-rules`,
                dateModified: new Date().toISOString(),
                publisher: { '@type': 'Organization', name: 'Haul Command' },
            })}} />

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1rem 5rem' }}>

                {/* Breadcrumb */}
                <nav style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 12, color: '#6B7280' }}>
                    <Link href="/tools/state-requirements" style={{ color: '#F1A91B', textDecoration: 'none' }}>State Requirements</Link>
                    <span>/</span>
                    <span>{s.name}</span>
                    <span>/</span>
                    <span style={{ color: '#F0F0F0' }}>Escort Vehicle Rules</span>
                </nav>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', gap: 6, padding: '3px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 2 }}>Regulations</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        {s.name} Escort Vehicle Rules
                    </h1>
                    <p style={{ marginTop: 8, color: '#6B7280', fontSize: 13, lineHeight: 1.6 }}>
                        Pilot car certification, insurance requirements, escort thresholds, and night travel rules for {s.name}.
                        Always verify with <a href={s.dotLink} target="_blank" rel="noopener noreferrer" style={{ color: '#F1A91B' }}>{s.certBody}</a> before your move.
                    </p>
                </div>

                {/* Key Facts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
                    {[
                        { label: 'Certification Required', value: s.cert ? '✅ Yes' : '❌ No', accent: s.cert ? '#10B981' : '#EF4444' },
                        { label: 'Height Pole Required', value: s.heightPole ? '✅ Yes' : '❌ No', accent: s.heightPole ? '#10B981' : '#EF4444' },
                        { label: 'Minimum Insurance', value: s.insurance, accent: '#F59E0B' },
                        { label: 'Night Travel', value: s.night, accent: s.night === 'Yes' ? '#10B981' : s.night === 'No' ? '#EF4444' : '#F59E0B' },
                        { label: '1 Escort Required At', value: s.escort1 + ' width', accent: '#3B82F6' },
                        { label: '2 Escorts Required At', value: s.escort2 + ' width', accent: '#EF4444' },
                    ].map(item => (
                        <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{item.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: item.accent }}>{item.value}</div>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <div style={{ background: 'rgba(241,169,27,0.05)', border: '1px solid rgba(241,169,27,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>State Notes</div>
                    <p style={{ margin: 0, fontSize: 13, color: '#D1D5DB', lineHeight: 1.6 }}>{s.notes}</p>
                    {s.certBody && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9CA3AF' }}>
                            Certifying authority: <a href={s.dotLink} target="_blank" rel="noopener noreferrer" style={{ color: '#F1A91B' }}>{s.certBody}</a>
                        </p>
                    )}
                </div>

                {/* Regulations Sponsor Slot */}
                <div style={{ marginBottom: 24 }}>
                    <AdGridSlot zone="regulations_sponsor" />
                </div>

                {/* AI Answer Block */}
                <div style={{ marginBottom: 32 }}>
                    <SnippetInjector
                        blocks={['definition', 'faq']}
                        term={`pilot car requirements ${s.name}`}
                        geo={s.name}
                        country="US"
                    />
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link href="/tools/state-requirements" style={{ fontSize: 12, color: '#F1A91B', textDecoration: 'none', fontWeight: 700 }}>
                        ← All States
                    </Link>
                    <Link href="/tools/permit-checker" style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}>
                        Check Permits for {s.name} →
                    </Link>
                    <Link href={`/near/${state.toLowerCase()}-escort`} style={{ fontSize: 12, color: '#6B7280', textDecoration: 'none', fontWeight: 600 }}>
                        Find Escorts Near Me →
                    </Link>
                </div>

                {/* Data Teaser */}
                <div style={{ marginTop: 32 }}>
                    <DataTeaserStrip geo={s.name} />
                </div>
            </div>
        </div>
    );
}

export async function generateStaticParams() {
    return Object.keys(STATE_DATA).map(code => ({ state: code }));
}
