import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

interface Props {
    params: Promise<{ region: string; topic: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { region, topic } = await params;
    const supabase = createClient();
    const slug = `rules/${region}/${topic}`;

    const { data: page } = await supabase
        .from('seo_pages')
        .select('title, meta_description, canonical_url')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!page) {
        return { title: 'Regulation Not Found | Haul Command' };
    }

    return {
        title: `${page.title} | Haul Command`,
        description: page.meta_description,
        alternates: { canonical: page.canonical_url ?? `/${slug}` },
        openGraph: {
            title: page.title,
            description: page.meta_description,
        },
    };
}

export default async function RegionRulePage({ params }: Props) {
    const { region, topic } = await params;
    const supabase = createClient();
    const slug = `rules/${region}/${topic}`;

    // Fetch this page
    const { data: page } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

    if (!page) notFound();

    // Fetch related links
    const { data: links } = await supabase
        .from('seo_internal_links')
        .select('to_slug, weight')
        .eq('from_slug', slug)
        .order('weight', { ascending: false })
        .limit(10);

    // Fetch related pages info
    const relatedSlugs = (links ?? []).map(l => l.to_slug);
    const { data: relatedPages } = relatedSlugs.length > 0
        ? await supabase
            .from('seo_pages')
            .select('slug, title, type, region')
            .in('slug', relatedSlugs)
            .eq('status', 'published')
        : { data: [] };

    const regionDisplay = region
        .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Regulations', href: '/rules' },
        { name: regionDisplay, href: `/rules/${region}` },
        { name: page.h1, href: `/${slug}` },
    ];

    // JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BreadcrumbList',
                itemListElement: breadcrumbs.map((b, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    name: b.name,
                    item: `https://haulcommand.com${b.href}`,
                })),
            },
            {
                '@type': 'WebPage',
                name: page.title,
                description: page.meta_description,
                url: `https://haulcommand.com/${slug}`,
                ...(page.jsonld ?? {}),
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <main className="min-h-screen bg-slate-900 text-slate-50">
                {/* Hero */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 py-16 px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Breadcrumbs */}
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                                {breadcrumbs.map((b, i) => (
                                    <li key={b.href} className="flex items-center gap-2">
                                        {i > 0 && <span className="text-slate-600">/</span>}
                                        {i === breadcrumbs.length - 1
                                            ? <span className="text-slate-300">{b.name}</span>
                                            : <Link href={b.href} className="hover:text-amber-400 transition-colors">{b.name}</Link>
                                        }
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
                            🚛 {regionDisplay} Regulations
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                            {page.h1}
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl">
                            {page.meta_description}
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
                    {/* Content */}
                    {page.content_md ? (
                        <section className="prose prose-invert prose-slate max-w-none
              prose-headings:text-white prose-p:text-slate-300
              prose-strong:text-white prose-li:text-slate-300
              prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300
              prose-table:border-collapse prose-th:bg-slate-800 prose-th:text-amber-400
              prose-td:border prose-td:border-slate-700 prose-th:border prose-th:border-slate-700">
                            <div dangerouslySetInnerHTML={{ __html: page.content_md }} />
                        </section>
                    ) : (
                        /* Draft / content not yet filled in */
                        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
                            <div className="text-4xl mb-4">🚧</div>
                            <h2 className="text-xl font-bold text-amber-400 mb-2">Full Regulations Coming Soon</h2>
                            <p className="text-slate-400">
                                We&apos;re researching and verifying {regionDisplay} pilot car requirements.
                                In the meantime, find certified {regionDisplay} escort operators below.
                            </p>
                        </section>
                    )}

                    {/* Broker + Escort CTAs */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <div className="text-2xl mb-3">📋</div>
                            <h2 className="text-lg font-bold text-white mb-2">Need to Move a Load in {regionDisplay}?</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Post your move and get matched with certified {regionDisplay} escorts in minutes.
                            </p>
                            <Link href="/start?role=broker"
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                                Post a Move →
                            </Link>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
                            <div className="text-2xl mb-3">🚘</div>
                            <h2 className="text-lg font-bold text-white mb-2">Are You a {regionDisplay} Escort Operator?</h2>
                            <p className="text-slate-400 text-sm mb-4">
                                Create your free verified profile and start receiving job offers in {regionDisplay}.
                            </p>
                            <Link href="/start?role=escort"
                                className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
                                Claim Your Profile →
                            </Link>
                        </div>
                    </section>

                    {/* Related Links */}
                    {relatedPages && relatedPages.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">Related Resources</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {relatedPages.map(p => (
                                    <Link key={p.slug} href={`/${p.slug}`}
                                        className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 hover:border-amber-500/40 hover:bg-slate-800 rounded-lg px-4 py-3 transition-all group">
                                        <span className="text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
                                        <span className="text-slate-300 text-sm">{p.title}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Directory CTA */}
                    <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Find Certified {regionDisplay} Pilot Car Services
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Browse verified escort operators who know {regionDisplay} regulations inside and out.
                        </p>
                        <Link href={`/directory/us/${region}`}
                            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors">
                            Browse {regionDisplay} Escorts →
                        </Link>
                    </section>
                </div>
            </main>
        </>
    );
}
