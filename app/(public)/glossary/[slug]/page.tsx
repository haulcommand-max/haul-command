import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getGlossaryAnnotationMap, getGlossaryTerm, getTermUsages } from '@/lib/glossary/api';
import { ChevronRight, ExternalLink, Settings, Shield, BookOpen, AlertTriangle } from 'lucide-react';
import { NativeAdCard } from '@/components/ads/NativeAdCard';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    
    // Resolve canonical slug for metadata
    const annotationMap = await getGlossaryAnnotationMap();
    const mapSlug = annotationMap[slug.toLowerCase()];
    const canonicalSlug = mapSlug ?? slug;

    const term = await getGlossaryTerm(canonicalSlug);
    if (!term) return { title: 'Term Not Found | Haul Command Glossary' };

    return {
        title: `${term.term} (${term.synonyms?.[0] || 'Definition'}) | Haul Command Glossary`,
        description: term.short_definition || `Read the official definition of ${term.term} and related heavy haul terminology in the Haul Command Glossary.`,
        alternates: { canonical: `/glossary/${canonicalSlug}` },
        robots: 'index,follow',
        openGraph: {
            title: `${term.term} | Haul Command Glossary`,
            description: term.short_definition,
        },
    };
}

export default async function GlossaryTermPage({ params }: Props) {
    const { slug } = await params;

    // Check canonical redirect
    const annotationMap = await getGlossaryAnnotationMap();
    const mapSlug = annotationMap[slug.toLowerCase()];
    if (mapSlug && mapSlug !== slug.toLowerCase()) {
        redirect(`/glossary/${mapSlug}`);
    }

    const term = await getGlossaryTerm(slug);
    if (!term) notFound();

    // Usage mentions
    const usages = await getTermUsages(term.slug, 5);

    // Dynamic blocks logic
    const isEscortOperations = term.category === 'escort_operations' || term.slug.includes('pilot-car') || term.slug.includes('escort');

    // Schema
    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${term.term} Definition & Guide`,
        description: term.short_definition,
        publisher: { '@type': 'Organization', name: 'Haul Command' },
        url: `https://haulcommand.com/glossary/${term.slug}`,
    };

    const faqItems = [];
    faqItems.push({
        '@type': 'Question',
        name: `What is a ${term.term}?`,
        acceptedAnswer: { '@type': 'Answer', text: term.short_definition }
    });
    
    if (isEscortOperations) {
        faqItems.push({
            '@type': 'Question',
            name: `What is the difference between federal and state rules for ${term.term}s?`,
            acceptedAnswer: { '@type': 'Answer', text: `Federal law leaves specific size and weight triggers for escort vehicles to individual states. As a result, width and height triggers, equipment requirements, and certification rules vary widely.` }
        });
    }

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <main style={{ minHeight: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: "'Inter', system-ui" }}>
                <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>
                    
                    {/* Breadcrumbs */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280', marginBottom: '2rem' }}>
                        <Link href="/" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Home</Link>
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <Link href="/glossary" style={{ color: '#8fa3b8', textDecoration: 'none' }}>Glossary</Link>
                        {term.category && (
                            <>
                                <ChevronRight style={{ width: 12, height: 12 }} />
                                <Link href="/glossary" style={{ color: '#8fa3b8', textDecoration: 'none', textTransform: 'capitalize' }}>
                                    {term.category.replace(/_/g, ' ')}
                                </Link>
                            </>
                        )}
                        <ChevronRight style={{ width: 12, height: 12 }} />
                        <span style={{ color: '#C6923A', fontWeight: 600 }}>{term.term}</span>
                    </nav>

                    {/* Header */}
                    <header style={{ marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#f9fafb', letterSpacing: '-0.02em' }}>
                            {term.term}
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: '#d1d5db', lineHeight: 1.6, maxWidth: '800px', margin: 0 }}>
                            {term.short_definition}
                        </p>
                    </header>

                    {/* Term Meta Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                        
                        {/* Synonyms & Acronyms */}
                        {(term.synonyms?.length > 0 || term.acronyms?.length > 0) && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                    Also Known As
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {[...(term.synonyms || []), ...(term.acronyms || [])].map((alias, i) => (
                                        <span key={i} style={{ padding: '4px 12px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}>
                                            {alias}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regions */}
                        {term.applicable_countries?.length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem' }}>
                                <h3 style={{ fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                                    Applicable Regions
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {term.applicable_countries.slice(0, 8).map(cc => (
                                        <Link key={cc} href={`/glossary/country/${cc.toLowerCase()}`} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: '#d1d5db', borderRadius: '4px', fontSize: '13px', textDecoration: 'none' }}>
                                            {cc}
                                        </Link>
                                    ))}
                                    {term.applicable_countries.length > 8 && (
                                        <span style={{ fontSize: '13px', color: '#6b7280', alignSelf: 'center' }}>+{term.applicable_countries.length - 8} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
                        
                        {/* Main Content Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            
                            {/* Deep Definition */}
                            {term.long_definition && (
                                <section>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <BookOpen style={{ color: '#38bdf8' }} size={24} /> Delving Deeper into {term.term}
                                    </h2>
                                    <div style={{ fontSize: '1rem', color: '#a1a1aa', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: term.long_definition }} />
                                </section>
                            )}

                            {/* Dynamic: State vs Federal Differences for Escort Operations */}
                            {isEscortOperations && (
                                <section style={{ background: 'rgba(198,146,58,0.05)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: '12px', padding: '1.5rem', borderLeft: '4px solid #C6923A' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield style={{ color: '#C6923A' }} size={20} /> Federal vs. State Jurisdictions
                                    </h2>
                                    <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                                        In the United States, federal law does not mandate specific size triggers for required escort vehicles. Instead, individual states regulate width, height, and length thresholds independently.
                                    </p>
                                    <ul style={{ color: '#a1a1aa', fontSize: '0.9rem', paddingLeft: '1.5rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                        <li><strong>Width triggers</strong> typically start between 8'6" and 12'0" depending on the state and route class.</li>
                                        <li><strong>Height pole requirements</strong> are strictly enforced and vary per state structure clearances.</li>
                                        <li><strong>Certification rules</strong>: Some states issue cross-honored certifications, while others (like NY and FL) dictate specialized local testing.</li>
                                    </ul>
                                    <Link href="/tools/state-requirements" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#C6923A', fontWeight: 600, textDecoration: 'none' }}>
                                        Use our Escort Requirement Finder to check exact state rules <ChevronRight size={16} />
                                    </Link>
                                </section>
                            )}

                            {/* Dynamic: In the field / Operations context */}
                            {isEscortOperations && (
                                <section>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f9fafb', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Settings style={{ color: '#10b981' }} size={24} /> In the Field: How this works
                                    </h2>
                                    <p style={{ color: '#a1a1aa', fontSize: '1rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                                        During a transport operation, escort vehicles take active roles communicating hazard proximity and controlling traffic flow. For example:
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ margin: '0 0 8px', color: '#10b981', fontSize: '0.95rem' }}>Lead Escorts</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.5 }}>Observe oncoming traffic, clear intersections, and communicate hazard proximity (like low bridges using a height pole) heavily utilizing CB radio.</p>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ margin: '0 0 8px', color: '#38bdf8', fontSize: '0.95rem' }}>Chase Escorts</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.5 }}>Prevent unsafe overtaking by civilian traffic, monitor rear load shift, and safely control lane-change maneuvers via radio coordination.</p>
                                        </div>
                                    </div>
                                </section>
                            )}
                            
                            {/* Ad Space */}
                            <NativeAdCard surface="glossary_bottom" placementId="glossary-term-inline" variant="inline" />

                            {/* Errors / Common Mistakes */}
                            {term.common_mistakes && (
                                <section style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertTriangle size={20} /> Common Misconceptions
                                    </h2>
                                    <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                                        {term.common_mistakes}
                                    </p>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            {/* Tools & Services Block */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#fff' }}>Haul Command Tools</h3>
                                </div>
                                <div style={{ padding: '0.5rem' }}>
                                    {[
                                        { title: 'Permit Checker', href: '/tools/permit-checker', desc: 'Verify required state permits.' },
                                        { title: 'Escort Rules Tool', href: '/tools/state-requirements', desc: 'Look up state thresholds.' },
                                        { title: 'Rate Estimator', href: '/tools/rate-lookup', desc: 'Predict transport costs.' },
                                        { title: 'Broker Verify', href: '/brokers', desc: 'Check freight broker reps.' },
                                    ].map(tool => (
                                        <Link key={tool.title} href={tool.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '6px', color: '#d1d5db', textDecoration: 'none', transition: 'background 0.2s' }} className="hover:bg-white/5 group">
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#38bdf8', fontSize: '0.9rem' }}>{tool.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{tool.desc}</div>
                                            </div>
                                            <ExternalLink size={14} className="opacity-50 group-hover:opacity-100 group-hover:text-blue-400" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Internal Linking / Conversion CTA */}
                            {isEscortOperations && (
                                <div style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.2) 0%, rgba(3,105,161,0.2) 100%)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: '12px', padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#f0f9ff' }}>Find Certified Operators</h3>
                                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#bae6fd', lineHeight: 1.5 }}>
                                        Source insured and experienced pilot car operators instantly through the Haul Command Directory.
                                    </p>
                                    <Link href="/directory" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '0.75rem 1rem', background: '#0284c7', color: '#fff', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>
                                        Search the Directory →
                                    </Link>
                                    <Link href="/quote" style={{ display: 'block', textAlign: 'center', width: '100%', padding: '0.75rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px', textDecoration: 'none', marginTop: '8px' }}>
                                        Get a Free Quote
                                    </Link>
                                </div>
                            )}

                            {/* Contextual Usage from Codebase */}
                            {usages.length > 0 && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Where this is used</h3>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#a1a1aa', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {usages.map((u, i) => (
                                            <li key={i}>
                                                <Link href={u.page_path} style={{ color: '#38bdf8', textDecoration: 'none' }}>
                                                    {u.page_type || u.page_path.split('/').pop() || 'Page'}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Market Resources — Directory + Rates links */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Market Resources</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {[
                                        { href: '/directory/us/tx', label: 'Texas Pilot Cars' },
                                        { href: '/directory/us/fl', label: 'Florida Pilot Cars' },
                                        { href: '/directory/us/ca', label: 'California Pilot Cars' },
                                        { href: '/directory/us/la', label: 'Louisiana Pilot Cars' },
                                        { href: '/rates/tx/pilot-car-cost', label: 'Texas Rate Guide' },
                                        { href: '/rates/fl/pilot-car-cost', label: 'Florida Rate Guide' },
                                    ].map(l => (
                                        <Link key={l.href} href={l.href} style={{ fontSize: '0.85rem', color: '#C6923A', textDecoration: 'none', fontWeight: 500 }}
                                            className="hover:underline">
                                            {l.label} →
                                        </Link>
                                    ))}
                                </div>
                            </div>

                        </aside>
                    </div>
                </div>
            </main>
        </>
    );
}
