import React from 'react';
import { notFound } from 'next/navigation';
import { detectUserGeo, generateNearMeMetadata, buildFreshnessSignals, generateNearMeRoutes } from '@/lib/seo/near-me-engine';
import { CORE_SERVICES, INTENT_MODIFIERS, type ServiceTerm } from '@/lib/seo/long-tail-domination';
import Link from 'next/link';

interface Props {
    params: Promise<{
        service: string;
        modifier: string;
    }>;
}

export async function generateStaticParams() {
    return generateNearMeRoutes().map(r => ({
        service: r.service,
        modifier: r.modifier,
    }));
}

export async function generateMetadata({ params }: Props) {
    const { service, modifier } = await params;
    const geo = await detectUserGeo();
    
    const serviceDef = CORE_SERVICES.find(s => s.slug === service);
    if (!serviceDef) return {};

    const meta = generateNearMeMetadata(serviceDef, geo, modifier);
    return {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords.join(', '),
    };
}

export default async function NearMePage({ params }: Props) {
    const { service, modifier } = await params;
    
    // Validate service and modifier
    const serviceDef = CORE_SERVICES.find(s => s.slug === service);
    const modDef = INTENT_MODIFIERS.find(m => m.slug === modifier);

    if (!serviceDef || !modDef) {
        notFound();
    }

    const geo = await detectUserGeo();
    const freshness = buildFreshnessSignals(geo);
    const meta = generateNearMeMetadata(serviceDef, geo, modifier);

    return (
        <div className="min-h-screen bg-hc-bg text-white px-4 py-12">
            <div className="max-w-4xl mx-auto">
                {/* Internal Nav */}
                <nav className="text-sm breadcrumbs mb-6 text-hc-muted">
                    <ul className="flex gap-2">
                        <li><Link href="/" className="hover:text-white">Home</Link></li>
                        <li>/</li>
                        <li><span className="capitalize">{service.replace(/-/g, ' ')}</span></li>
                        <li>/</li>
                        <li className="font-bold text-white capitalize">{modifier.replace(/-/g, ' ')}</li>
                    </ul>
                </nav>

                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                    {meta.title}
                </h1>
                
                <p className="text-xl text-hc-muted mb-6">
                    {meta.description}
                </p>

                {/* Freshness Badge */}
                <div className="inline-block bg-hc-gold-500/10 border border-hc-gold-500/20 text-hc-gold-500 text-xs font-bold px-3 py-1 rounded-full mb-12">
                    {freshness.freshBadge}
                </div>

                {/* Contextual Box */}
                <div className="bg-[#0B0B0C] border border-white/10 rounded-2xl p-8 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-hc-gold-500/5 blur-3xl -z-10 rounded-full mix-blend-screen" />
                    
                    <h2 className="text-2xl font-bold mb-4">Local Coverage Area</h2>
                    {geo.confident ? (
                        <>
                            <p className="text-hc-muted mb-4">
                                We've detected your search area as <strong>{geo.city ? `${geo.city}, ${geo.region}` : geo.region || geo.country}</strong>.
                            </p>
                            <p className="text-hc-muted mb-4">
                                Dispatching trusted <strong>{geo.localPrimaryTerm}</strong> professionals with verified credentials, matching your specific criteria:{' '}
                                <span className="text-white font-medium capitalize">{modDef.label}</span>.
                            </p>
                        </>
                    ) : (
                        <p className="text-hc-muted mb-6">
                            Finding the best <strong>{serviceDef.label}</strong> professionals across our global network, matching your specific search for <strong>{modDef.label}</strong>.
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-6">
                        <Link href={`/directory?service=${service}&location=${geo.city || geo.region || geo.country}`} className="bg-hc-gold-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-hc-gold-400 transition">
                            View All Local Operators
                        </Link>
                        <Link href="/loads/post" className="bg-white/10 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/20 transition">
                            Post a Load Urgently
                        </Link>
                    </div>
                </div>

                {/* Local Terminology (SEO Juice) */}
                {geo.localAltTerms.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                        <h3 className="text-sm font-bold text-hc-muted uppercase tracking-wider mb-4">Also known locally as</h3>
                        <div className="flex flex-wrap gap-2">
                            {geo.localAltTerms.map(term => (
                                <span key={term} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400">
                                    {term}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
