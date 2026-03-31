import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Shield, Phone, Mail, ExternalLink, Clock, AlertTriangle, CheckCircle, FileText, ChevronRight } from 'lucide-react';

/* ──────────────────────────────────────────────────── */
/*  Types                                                */
/* ──────────────────────────────────────────────────── */
interface Props {
    params: Promise<{ country: string; region: string; topic: string }>;
}

interface RulesetRow {
    id: string;
    category: string;
    summary_markdown: string;
    decision_rules: Record<string, unknown>;
    confidence_score: number;
    verification: string;
    last_verified_at: string | null;
    effective_from: string | null;
    source_id: string | null;
    authority_threshold_tables: ThresholdRow[];
}

interface ThresholdRow {
    id: string;
    table_key: string;
    unit_system: string;
    rows: Record<string, unknown>[];
}

interface ContactRow {
    id: string;
    contact_name: string | null;
    role_title: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    hours: string | null;
    timezone: string | null;
    preferred_contact_method: string | null;
    notes: string | null;
    confidence_score: number;
    verification: string;
    last_verified_at: string | null;
    authority_orgs: { name: string; org_type: string; website: string | null } | null;
}

interface SourceRow {
    id: string;
    title: string | null;
    url: string;
    doc_type: string | null;
    publisher: string | null;
    tier: string;
    last_changed_at: string | null;
}

/* ──────────────────────────────────────────────────── */
/*  Helpers                                              */
/* ──────────────────────────────────────────────────── */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://haulcommand.com';

function humanizeCategory(cat: string): string {
    return cat
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function confidenceBadge(score: number) {
    if (score >= 0.9) return { label: 'High Confidence', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 0.7) return { label: 'Medium Confidence', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { label: 'Low Confidence', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
}

function verificationIcon(status: string) {
    if (status === 'verified') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (status === 'stale') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    return <Clock className="w-4 h-4 text-slate-500" />;
}

/* ──────────────────────────────────────────────────── */
/*  Metadata                                             */
/* ──────────────────────────────────────────────────── */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { country, region, topic } = await params;
    const regionDisplay = region.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const topicDisplay = humanizeCategory(topic.replace(/-/g, '_'));
    const countryUpper = country.toUpperCase();

    const title = `${topicDisplay} — ${regionDisplay}, ${countryUpper} | Haul Command Authority Hub`;
    const description = `Official ${topicDisplay.toLowerCase()} rules, contacts, and compliance requirements for ${regionDisplay}, ${countryUpper}. Verified by Haul Command.`;

    return {
        title,
        description,
        alternates: { canonical: `${SITE}/authority/${country}/${region}/${topic}` },
        openGraph: {
            title,
            description,
            url: `${SITE}/authority/${country}/${region}/${topic}`,
            type: 'article',
        },
    };
}

/* ──────────────────────────────────────────────────── */
/*  Page Component                                       */
/* ──────────────────────────────────────────────────── */
export default async function AuthorityHubPage({ params }: Props) {
    const { country, region, topic } = await params;
    const supabase = createClient();

    // 1) Find jurisdiction
    const { data: jurisdiction } = await supabase
        .from('authority_jurisdictions')
        .select('id, name, level, country_code, admin1_code, seo_page_id')
        .eq('country_code', country.toUpperCase())
        .eq('slug', region)
        .single();

    if (!jurisdiction) notFound();

    // 2) Fetch rulesets for this topic in this jurisdiction
    const categoryKey = topic.replace(/-/g, '_');
    const { data: rulesets } = await supabase
        .from('authority_rulesets')
        .select(`
            id, category, summary_markdown, decision_rules,
            confidence_score, verification, last_verified_at, effective_from, source_id,
            authority_threshold_tables (id, table_key, unit_system, rows)
        `)
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('category', categoryKey)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1);

    const ruleset: RulesetRow | null = rulesets && rulesets.length > 0 ? rulesets[0] as unknown as RulesetRow : null;

    // 3) Fetch contacts for this jurisdiction
    const { data: contacts } = await supabase
        .from('authority_contacts')
        .select(`
            id, contact_name, role_title, phone, email, address, hours, timezone,
            preferred_contact_method, notes, confidence_score, verification, last_verified_at,
            authority_orgs (name, org_type, website)
        `)
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('confidence_score', { ascending: false });

    // 4) Fetch sources (for citations)
    const { data: sources } = await supabase
        .from('authority_sources')
        .select('id, title, url, doc_type, publisher, tier, last_changed_at')
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true)
        .order('tier');

    // 5) Fetch related rulesets (other categories for same jurisdiction)
    const { data: otherRulesets } = await supabase
        .from('authority_rulesets')
        .select('category')
        .eq('jurisdiction_id', jurisdiction.id)
        .eq('is_active', true)
        .neq('category', categoryKey);

    const otherCategories = [...new Set((otherRulesets ?? []).map(r => r.category))];

    const regionDisplay = jurisdiction.name;
    const countryUpper = country.toUpperCase();
    const topicDisplay = humanizeCategory(categoryKey);

    // Breadcrumbs
    const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Authority Directory', href: '/authority' },
        { name: countryUpper, href: `/authority/${country}` },
        { name: regionDisplay, href: `/authority/${country}/${region}` },
        { name: topicDisplay, href: `/authority/${country}/${region}/${topic}` },
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
                    item: `${SITE}${b.href}`,
                })),
            },
            {
                '@type': 'GovernmentService',
                name: `${topicDisplay} — ${regionDisplay}`,
                description: `Official ${topicDisplay.toLowerCase()} information for ${regionDisplay}, ${countryUpper}.`,
                url: `${SITE}/authority/${country}/${region}/${topic}`,
                areaServed: {
                    '@type': 'AdministrativeArea',
                    name: regionDisplay,
                },
                provider: {
                    '@type': 'Organization',
                    name: 'Haul Command',
                    url: SITE,
                },
            },
            ...(ruleset ? [{
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: `What are the ${topicDisplay.toLowerCase()} rules in ${regionDisplay}?`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: ruleset.summary_markdown.slice(0, 500),
                        },
                    },
                ],
            }] : []),
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
                    <div className="max-w-5xl mx-auto">
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
                                {breadcrumbs.map((b, i) => (
                                    <li key={b.href} className="flex items-center gap-2">
                                        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                                        {i === breadcrumbs.length - 1
                                            ? <span className="text-slate-300">{b.name}</span>
                                            : <Link aria-label="Navigation Link" href={b.href} className="hover:text-amber-400 transition-colors">{b.name}</Link>
                                        }
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                                <Shield className="w-3.5 h-3.5" /> Authority Hub
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-xs font-semibold">
                                {countryUpper} › {regionDisplay}
                            </div>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">
                            {topicDisplay}
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl">
                            Official {topicDisplay.toLowerCase()} rules, permit contacts, and compliance requirements for {regionDisplay}, {countryUpper}.
                        </p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
                    {/* ── Rules Summary ── */}
                    {ruleset ? (
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-amber-400" />
                                    Rules Summary
                                </h2>
                                <div className="flex items-center gap-3">
                                    {verificationIcon(ruleset.verification)}
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${confidenceBadge(ruleset.confidence_score).color}`}>
                                        {confidenceBadge(ruleset.confidence_score).label}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-8">
                                <div className="prose prose-invert prose-slate max-w-none
                                    prose-headings:text-white prose-p:text-slate-300
                                    prose-strong:text-white prose-li:text-slate-300
                                    prose-a:text-amber-400 prose-a:no-underline hover:prose-a:text-amber-300
                                    prose-table:border-collapse prose-th:bg-slate-800 prose-th:text-amber-400
                                    prose-td:border prose-td:border-slate-700 prose-th:border prose-th:border-slate-700">
                                    <div dangerouslySetInnerHTML={{ __html: ruleset.summary_markdown }} />
                                </div>

                                {ruleset.last_verified_at && (
                                    <div className="mt-6 pt-4 border-t border-slate-700 flex items-center gap-2 text-xs text-slate-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        Last verified: {new Date(ruleset.last_verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            {/* Threshold Tables */}
                            {ruleset.authority_threshold_tables && ruleset.authority_threshold_tables.length > 0 && (
                                <div className="mt-8 space-y-6">
                                    {ruleset.authority_threshold_tables.map((tt: ThresholdRow) => (
                                        <div key={tt.id} className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
                                            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700">
                                                <h3 className="text-lg font-bold text-white">
                                                    {humanizeCategory(tt.table_key)}
                                                </h3>
                                                <span className="text-xs text-slate-500">Unit system: {tt.unit_system}</span>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-800">
                                                            {tt.rows && (tt.rows as Record<string, unknown>[]).length > 0 &&
                                                                Object.keys((tt.rows as Record<string, unknown>[])[0]).map(k => (
                                                                    <th key={k} className="px-4 py-3 text-left text-amber-400 font-semibold border-b border-slate-700">
                                                                        {humanizeCategory(k)}
                                                                    </th>
                                                                ))
                                                            }
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(tt.rows as Record<string, unknown>[]).map((row, ri) => (
                                                            <tr key={ri} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                                                                {Object.values(row).map((v, vi) => (
                                                                    <td key={vi} className="px-4 py-3 text-slate-300">
                                                                        {String(v ?? '—')}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center">
                            <div className="text-4xl mb-4">🚧</div>
                            <h2 className="text-xl font-bold text-amber-400 mb-2">Rules Data Coming Soon</h2>
                            <p className="text-slate-400">
                                We&apos;re researching and verifying {topicDisplay.toLowerCase()} for {regionDisplay}.
                                <br />Check the contacts below for direct authority information.
                            </p>
                        </section>
                    )}

                    {/* ── Authority Contacts ── */}
                    {contacts && contacts.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Phone className="w-6 h-6 text-emerald-400" />
                                Authority Contacts
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(contacts as unknown as ContactRow[]).map(c => (
                                    <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">
                                                    {c.authority_orgs?.name ?? c.contact_name ?? 'Contact'}
                                                </h3>
                                                {c.role_title && (
                                                    <p className="text-sm text-slate-400">{c.role_title}</p>
                                                )}
                                                {c.authority_orgs?.org_type && (
                                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                                        {humanizeCategory(c.authority_orgs.org_type)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {verificationIcon(c.verification)}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {c.phone && (
                                                <a href={`tel:${c.phone}`}
                                                    className="flex items-center gap-2.5 text-emerald-400 hover:text-emerald-300 transition-colors">
                                                    <Phone className="w-4 h-4" />
                                                    {c.phone}
                                                </a>
                                            )}
                                            {c.email && (
                                                <a href={`mailto:${c.email}`}
                                                    className="flex items-center gap-2.5 text-blue-400 hover:text-blue-300 transition-colors">
                                                    <Mail className="w-4 h-4" />
                                                    {c.email}
                                                </a>
                                            )}
                                            {c.authority_orgs?.website && (
                                                <a href={c.authority_orgs.website} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 text-amber-400 hover:text-amber-300 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                    Official Website
                                                </a>
                                            )}
                                            {c.hours && (
                                                <div className="flex items-center gap-2.5 text-slate-400">
                                                    <Clock className="w-4 h-4" />
                                                    {c.hours}{c.timezone ? ` (${c.timezone})` : ''}
                                                </div>
                                            )}
                                            {c.address && (
                                                <p className="text-slate-500 text-xs mt-2">{c.address}</p>
                                            )}
                                            {c.notes && (
                                                <p className="text-slate-500 text-xs italic">{c.notes}</p>
                                            )}
                                        </div>

                                        {c.last_verified_at && (
                                            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-500 flex items-center gap-1.5">
                                                <CheckCircle className="w-3 h-3" />
                                                Verified {new Date(c.last_verified_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Other Rule Categories ── */}
                    {otherCategories.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-6">
                                More {regionDisplay} Regulations
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {otherCategories.map(cat => (
                                    <Link aria-label="Navigation Link"
                                        key={cat}
                                        href={`/authority/${country}/${region}/${cat.replace(/_/g, '-')}`}
                                        className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 hover:border-amber-500/40 hover:bg-slate-800 rounded-lg px-4 py-3 transition-all group"
                                    >
                                        <span className="text-amber-400 group-hover:translate-x-1 transition-transform">
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
                                        <span className="text-slate-300 text-sm">{humanizeCategory(cat)}</span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Sources & Citations ── */}
                    {sources && sources.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-400" />
                                Sources & Citations
                            </h2>
                            <div className="bg-slate-800/40 border border-slate-700 rounded-xl divide-y divide-slate-700/50">
                                {(sources as unknown as SourceRow[]).map((s, i) => (
                                    <div key={s.id} className="px-6 py-4 flex items-start gap-4">
                                        <span className="text-xs text-slate-500 font-mono mt-1">[{i + 1}]</span>
                                        <div className="flex-1 min-w-0">
                                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                                                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
                                                {s.title || s.url}
                                                <ExternalLink className="w-3 h-3 inline ml-1.5" />
                                            </a>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                {s.publisher && <span>{s.publisher}</span>}
                                                {s.doc_type && <span className="bg-slate-700 px-1.5 py-0.5 rounded">{s.doc_type}</span>}
                                                <span className={
                                                    s.tier === 'official' ? 'text-emerald-500' :
                                                        s.tier === 'quasi_official' ? 'text-blue-500' : 'text-amber-500'
                                                }>
                                                    {s.tier.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Report Correction CTA ── */}
                    <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Something Wrong?</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    If you notice incorrect contact info, outdated rules, or missing data, report it
                                    and we&apos;ll verify within 24 hours.
                                </p>
                                <Link aria-label="Navigation Link"
                                    href={`/authority/${country}/${region}/report?topic=${topic}&jid=${jurisdiction.id}`}
                                    className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Report a Correction →
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* ── Directory CTA ── */}
                    <section className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-3">
                            Find Certified {regionDisplay} Pilot Car Services
                        </h2>
                        <p className="text-slate-400 mb-6">
                            Browse verified escort operators who know {regionDisplay} regulations inside and out.
                        </p>
                        <Link aria-label="Navigation Link"
                            href={`/directory/${country}/${region}`}
                            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors"
                        >
                            Browse {regionDisplay} Escorts →
                        </Link>
                    </section>
                </div>
            </main>
        </>
    );
}
