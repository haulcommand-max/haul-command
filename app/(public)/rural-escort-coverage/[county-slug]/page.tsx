export const dynamic = 'force-dynamic';
export const revalidate = 3600;
/**
 * /rural-escort-coverage/[county-slug]
 * FCC County rural escort coverage pages — Florida Fiscally Constrained Counties (and future states).
 * Template: /rural-escort-coverage/[county]-fl
 * SSG: 27 FL FCC county pages pre-generated at build time.
 *
 * Targets:
 *   "pilot car Baker County FL"
 *   "oversize escort Suwannee County Florida"
 *   "rural escort coverage Gadsden County"
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Florida FCC counties — static for SSG (no DB call at build time)
const FCC_COUNTIES: Record<string, { name: string; region: string; highways: string[]; description: string }> = {
    'baker-fl': { name: 'Baker', region: 'North Florida', highways: ['US-90', 'US-301'], description: 'Rural North Florida county along the I-10 corridor' },
    'bradford-fl': { name: 'Bradford', region: 'North Central Florida', highways: ['US-301', 'SR-16'], description: 'Small rural county between Gainesville and Jacksonville' },
    'calhoun-fl': { name: 'Calhoun', region: 'Panhandle', highways: ['SR-20', 'SR-71'], description: 'Rural Panhandle county with agricultural and timber hauls' },
    'columbia-fl': { name: 'Columbia', region: 'North Florida', highways: ['I-75', 'US-41', 'US-90'], description: 'Gateway county on I-75 north of Gainesville' },
    'dixie-fl': { name: 'Dixie', region: 'Nature Coast', highways: ['US-19', 'US-27'], description: 'Coastal rural county with limited escort coverage' },
    'franklin-fl': { name: 'Franklin', region: 'Panhandle Coast', highways: ['US-98', 'SR-65'], description: 'Gulf-coast Panhandle county with coastal project hauls' },
    'gadsden-fl': { name: 'Gadsden', region: 'Panhandle', highways: ['I-10', 'US-90'], description: 'Panhandle county adjacent to Tallahassee' },
    'gilchrist-fl': { name: 'Gilchrist', region: 'North Central Florida', highways: ['US-129', 'SR-26'], description: 'Small agricultural county west of Gainesville' },
    'glades-fl': { name: 'Glades', region: 'South-Central Florida', highways: ['US-27', 'SR-78'], description: 'Rural inland county near Lake Okeechobee' },
    'gulf-fl': { name: 'Gulf', region: 'Panhandle Coast', highways: ['US-98', 'SR-71'], description: 'Panhandle Gulf-coast county with port and timber moves' },
    'hamilton-fl': { name: 'Hamilton', region: 'North Florida', highways: ['I-75', 'US-129'], description: 'Remote North Florida county on the Georgia border' },
    'hardee-fl': { name: 'Hardee', region: 'South-Central Florida', highways: ['US-17', 'SR-64'], description: 'Agricultural county in the heart of Florida' },
    'hendry-fl': { name: 'Hendry', region: 'South Florida', highways: ['US-27', 'SR-80'], description: 'Large rural county in South-Central Florida' },
    'holmes-fl': { name: 'Holmes', region: 'Panhandle', highways: ['US-90', 'SR-79'], description: 'Small Panhandle county with agricultural cargo moves' },
    'jackson-fl': { name: 'Jackson', region: 'Panhandle', highways: ['US-90', 'US-231', 'SR-2'], description: 'Largest Panhandle county with heavy agricultural hauls' },
    'jefferson-fl': { name: 'Jefferson', region: 'Big Bend', highways: ['US-19', 'US-27', 'US-90'], description: 'Rural Big Bend county between Tallahassee and Perry' },
    'lafayette-fl': { name: 'Lafayette', region: 'North Central Florida', highways: ['US-27', 'SR-53'], description: 'Very small rural county with minimal escort supply' },
    'levy-fl': { name: 'Levy', region: 'Nature Coast', highways: ['US-19', 'US-27', 'SR-24'], description: 'Coastal rural county west of Gainesville' },
    'liberty-fl': { name: 'Liberty', region: 'Panhandle', highways: ['SR-12', 'SR-20'], description: "Florida's least populated county — critical coverage gap" },
    'madison-fl': { name: 'Madison', region: 'North Florida', highways: ['I-10', 'US-90', 'US-221'], description: 'I-10 corridor county between Tallahassee and Lake City' },
    'okeechobee-fl': { name: 'Okeechobee', region: 'South-Central Florida', highways: ['US-441', 'US-98', 'SR-70'], description: 'Lake Okeechobee region with agricultural superloads' },
    'putnam-fl': { name: 'Putnam', region: 'Northeast Florida', highways: ['US-17', 'SR-20', 'SR-100'], description: 'Northeast Florida county between Gainesville and St. Augustine' },
    'suwannee-fl': { name: 'Suwannee', region: 'North Florida', highways: ['US-129', 'US-90', 'SR-51'], description: 'I-10 adjacent county with timber and agricultural hauls' },
    'taylor-fl': { name: 'Taylor', region: 'Big Bend', highways: ['US-19', 'US-27', 'US-98'], description: 'Big Bend coastal county with industrial port moves' },
    'union-fl': { name: 'Union', region: 'North Florida', highways: ['SR-121', 'US-90'], description: "Florida's smallest county — extremely limited escort supply" },
    'wakulla-fl': { name: 'Wakulla', region: 'Big Bend', highways: ['US-319', 'US-98', 'SR-267'], description: 'Big Bend coastal county south of Tallahassee' },
    'washington-fl': { name: 'Washington', region: 'Panhandle', highways: ['US-90', 'SR-79', 'SR-77'], description: 'North Panhandle county with timber and agricultural loads' },
};

// generateStaticParams removed — force-dynamic handles rendering at request time

export async function generateMetadata(
    { params }: { params: Promise<{ 'county-slug': string }> }
): Promise<Metadata> {
    const { 'county-slug': slug } = await params;
    const county = FCC_COUNTIES[slug];
    if (!county) return { title: 'Rural Escort Coverage | Haul Command' };
    return {
        title: `Rural Escort Coverage — ${county.name} County FL | Haul Command`,
        description: `TWIC-verified pilot car and oversize escort operators in ${county.name} County, Florida (${county.region}). ${county.description}. FDOT Fiscally Constrained County — guaranteed rural coverage.`,
        openGraph: { title: `${county.name} County Rural Escort Coverage`, description: `Oversize escort and pilot car services in ${county.name} County FL.` },
    };
}

export default async function FCCCountyCoveragePage(
    { params }: { params: Promise<{ 'county-slug': string }> }
) {
    const { 'county-slug': slug } = await params;
    const county = FCC_COUNTIES[slug];
    if (!county) return <div style={{ padding: '2rem', color: '#e5e7eb', background: '#08090e', minHeight: '100vh' }}>County not found.</div>;

    let svc: any = null;
    try {
        svc = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );
    } catch {}

    const { data: operators } = await svc
        .from('escort_profiles')
        .select('display_name, company_name, home_base_city, twic_verified, availability_status, trust_score')
        .eq('home_base_state', 'FL')
        .eq('is_published', true)
        .order('trust_score', { ascending: false })
        .limit(8);

    const operatorList = operators ?? [];
    const twicCount = operatorList.filter((o: any) => o.twic_verified).length;

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Rural Escort Coverage — ${county.name} County, Florida`,
        description: `${county.description}. FDOT Fiscally Constrained County (FCC) 2025-2026.`,
        areaServed: {
            '@type': 'AdministrativeArea',
            name: `${county.name} County`,
            containsPlace: { '@type': 'State', name: 'Florida' },
            additionalProperty: { '@type': 'PropertyValue', name: 'fiscallyConstrainedArea', value: true },
        },
        provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
    };

    return (
        <div style={{ minHeight: '100vh', background: '#08090e', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

            {/* Hero */}
            <div style={{ background: 'linear-gradient(180deg, #0f0c1a 0%, #08090e 100%)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '3rem 1.5rem 2rem' }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, marginBottom: 16, fontSize: 10, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        🏛️ FDOT Fiscally Constrained County · FL 2025–2026
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: '#f9fafb' }}>
                        Rural Escort Coverage — {county.name} County, FL
                    </h1>
                    <p style={{ margin: '0 0 16px', fontSize: 15, color: '#9ca3af', maxWidth: 620 }}>
                        {county.description}. Priority FCC coverage through the Haul Command rural operator network.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {county.highways.map(hw => (
                            <span key={hw} style={{ padding: '3px 10px', background: 'rgba(241,169,27,0.1)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#F1A91B' }}>{hw}</span>
                        ))}
                        <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#10b981' }}>{county.region}</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
                    {[
                        { label: 'FL Operators', value: operatorList.length.toString(), sub: 'Network coverage' },
                        { label: 'TWIC Verified', value: twicCount.toString(), sub: 'Port-access certified' },
                        { label: 'Priority', value: 'FCC', sub: '2025-2026 designation' },
                        { label: 'Coverage', value: 'Guaranteed', sub: 'Rural liquidity wedge' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#f9fafb' }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: '#4b5563' }}>{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* FCC explanation */}
                <section style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 16, padding: '1.5rem', marginBottom: 24 }}>
                    <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>FCC Rural Coverage Program</h2>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
                        Florida&apos;s Fiscally Constrained Counties have historically low escort operator density due to limited local funding. Haul Command&apos;s FCC program applies a priority recruitment layer, aggressive surge pricing eligibility, and guaranteed coverage commitments for all loads moving through {county.name} County.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['Guaranteed rural coverage', 'Hard-to-cover counties solved', `${county.region} coverage layer`].map(m => (
                            <span key={m} style={{ fontSize: 11, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '3px 10px', borderRadius: 10, fontWeight: 600 }}>✓ {m}</span>
                        ))}
                    </div>
                </section>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    <Link href="/directory/us/fl" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>
                        Find FL Escorts →
                    </Link>
                    <Link href="/quote" style={{ display: 'inline-block', padding: '12px 28px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 13, fontWeight: 700, borderRadius: 12, textDecoration: 'none' }}>
                        Get Rural Coverage Quote
                    </Link>
                </div>

                {/* Related FCC counties */}
                <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Other FCC Counties</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {Object.entries(FCC_COUNTIES).filter(([s]) => s !== slug).slice(0, 10).map(([s, c]) => (
                            <Link key={s} href={`/rural-escort-coverage/${s}`} style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none', padding: '4px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                                {c.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
