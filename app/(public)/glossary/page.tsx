export const revalidate = 3600;

import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Metadata } from 'next';
import { ScrollReveal, AnimatedCounter, StickyAlphabetNav, GlossarySearch } from '@/app/components/glossary/GlossaryAnimations';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { SmartPaywallBannerAnon } from '@/components/monetization/SmartPaywallBannerAnon';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const metadata: Metadata = {
    title: 'Heavy Haul & Pilot Car Glossary | Definitions & Rules | Haul Command',
    description: 'The definitive heavy haul and oversize load glossary. Industry terms defined across our 120-country framework. Pilot car, escort vehicle, superload, and DOT terminology.',
    alternates: { canonical: 'https://www.haulcommand.com/glossary' },
    openGraph: {
        title: 'Heavy Haul Glossary | Terms Defined | Haul Command',
        description: 'The most comprehensive heavy haul, oversize load, and escort terminology reference in the world.',
        url: 'https://www.haulcommand.com/glossary',
        siteName: 'Haul Command',
        type: 'website',
    },
};

/* ── Topic Categories ───────────────────────────────────────────── */
const TOPIC_CATEGORIES = [
    { slug: 'escort-equipment', emoji: '🚐', label: 'Escort Equipment', sub: 'Gear & Tools', gradient: 'from-blue-600/20 to-blue-900/5', accent: 'blue-400' },
    { slug: 'permits-regulations', emoji: '📜', label: 'Permits & Regulations', sub: 'Legal Rules', gradient: 'from-orange-600/20 to-orange-900/5', accent: 'orange-400' },
    { slug: 'route-planning', emoji: '🗺️', label: 'Route Planning', sub: 'Surveys & Clearances', gradient: 'from-teal-600/20 to-teal-900/5', accent: 'teal-400' },
    { slug: 'load-types', emoji: '📦', label: 'Load Types', sub: 'Dimensions & Weight', gradient: 'from-amber-600/20 to-amber-900/5', accent: 'amber-400' },
    { slug: 'safety', emoji: '🚦', label: 'Safety', sub: 'Compliance & Risks', gradient: 'from-red-600/20 to-red-900/5', accent: 'red-400' },
    { slug: 'rates-costs', emoji: '💵', label: 'Rates & Costs', sub: 'Negotiation', gradient: 'from-emerald-600/20 to-emerald-900/5', accent: 'emerald-400' },
    { slug: 'vehicles', emoji: '🚗', label: 'Vehicles', sub: 'Pilot Cars & Trucks', gradient: 'from-cyan-600/20 to-cyan-900/5', accent: 'cyan-400' },
    { slug: 'documentation', emoji: '📋', label: 'Documentation', sub: 'Certs & Forms', gradient: 'from-violet-600/20 to-violet-900/5', accent: 'violet-400' },
];

/* ── Browse by Country — All Tiers ──────────────────────────────── */
const COUNTRY_TIERS = [
    {
        label: 'Tier A — Gold',
        color: '#D4A844',
        countries: [
            { code: 'us', flag: '🇺🇸', name: 'United States' },
            { code: 'ca', flag: '🇨🇦', name: 'Canada' },
            { code: 'au', flag: '🇦🇺', name: 'Australia' },
            { code: 'gb', flag: '🇬🇧', name: 'United Kingdom' },
            { code: 'nz', flag: '🇳🇿', name: 'New Zealand' },
            { code: 'za', flag: '🇿🇦', name: 'South Africa' },
            { code: 'de', flag: '🇩🇪', name: 'Germany' },
            { code: 'nl', flag: '🇳🇱', name: 'Netherlands' },
            { code: 'ae', flag: '🇦🇪', name: 'UAE' },
            { code: 'br', flag: '🇧🇷', name: 'Brazil' },
        ],
    },
    {
        label: 'Tier B — Blue',
        color: '#4A90D9',
        countries: [
            { code: 'ie', flag: '🇮🇪', name: 'Ireland' },
            { code: 'se', flag: '🇸🇪', name: 'Sweden' },
            { code: 'no', flag: '🇳🇴', name: 'Norway' },
            { code: 'dk', flag: '🇩🇰', name: 'Denmark' },
            { code: 'fi', flag: '🇫🇮', name: 'Finland' },
            { code: 'be', flag: '🇧🇪', name: 'Belgium' },
            { code: 'at', flag: '🇦🇹', name: 'Austria' },
            { code: 'ch', flag: '🇨🇭', name: 'Switzerland' },
            { code: 'es', flag: '🇪🇸', name: 'Spain' },
            { code: 'fr', flag: '🇫🇷', name: 'France' },
            { code: 'it', flag: '🇮🇹', name: 'Italy' },
            { code: 'pt', flag: '🇵🇹', name: 'Portugal' },
            { code: 'sa', flag: '🇸🇦', name: 'Saudi Arabia' },
            { code: 'qa', flag: '🇶🇦', name: 'Qatar' },
            { code: 'mx', flag: '🇲🇽', name: 'Mexico' },
            { code: 'in', flag: '🇮🇳', name: 'India' },
            { code: 'id', flag: '🇮🇩', name: 'Indonesia' },
            { code: 'th', flag: '🇹🇭', name: 'Thailand' },
        ],
    },
    {
        label: 'Tier C — Silver',
        color: '#8A8A8A',
        countries: [
            { code: 'pl', flag: '🇵🇱', name: 'Poland' },
            { code: 'cz', flag: '🇨🇿', name: 'Czechia' },
            { code: 'sk', flag: '🇸🇰', name: 'Slovakia' },
            { code: 'hu', flag: '🇭🇺', name: 'Hungary' },
            { code: 'si', flag: '🇸🇮', name: 'Slovenia' },
            { code: 'ee', flag: '🇪🇪', name: 'Estonia' },
            { code: 'lv', flag: '🇱🇻', name: 'Latvia' },
            { code: 'lt', flag: '🇱🇹', name: 'Lithuania' },
            { code: 'hr', flag: '🇭🇷', name: 'Croatia' },
            { code: 'ro', flag: '🇷🇴', name: 'Romania' },
            { code: 'bg', flag: '🇧🇬', name: 'Bulgaria' },
            { code: 'gr', flag: '🇬🇷', name: 'Greece' },
            { code: 'tr', flag: '🇹🇷', name: 'Turkey' },
            { code: 'kw', flag: '🇰🇼', name: 'Kuwait' },
            { code: 'om', flag: '🇴🇲', name: 'Oman' },
            { code: 'bh', flag: '🇧🇭', name: 'Bahrain' },
            { code: 'sg', flag: '🇸🇬', name: 'Singapore' },
            { code: 'my', flag: '🇲🇾', name: 'Malaysia' },
            { code: 'jp', flag: '🇯🇵', name: 'Japan' },
            { code: 'kr', flag: '🇰🇷', name: 'South Korea' },
            { code: 'cl', flag: '🇨🇱', name: 'Chile' },
            { code: 'ar', flag: '🇦🇷', name: 'Argentina' },
            { code: 'co', flag: '🇨🇴', name: 'Colombia' },
            { code: 'pe', flag: '🇵🇪', name: 'Peru' },
            { code: 'vn', flag: '🇻🇳', name: 'Vietnam' },
            { code: 'ph', flag: '🇵🇭', name: 'Philippines' },
        ],
    },
    {
        label: 'Tier D — Slate',
        color: '#64748B',
        countries: [
            { code: 'uy', flag: '🇺🇾', name: 'Uruguay' },
            { code: 'pa', flag: '🇵🇦', name: 'Panama' },
            { code: 'cr', flag: '🇨🇷', name: 'Costa Rica' },
            { code: 'il', flag: '🇮🇱', name: 'Israel' },
            { code: 'ng', flag: '🇳🇬', name: 'Nigeria' },
            { code: 'eg', flag: '🇪🇬', name: 'Egypt' },
            { code: 'ke', flag: '🇰🇪', name: 'Kenya' },
            { code: 'ma', flag: '🇲🇦', name: 'Morocco' },
            { code: 'rs', flag: '🇷🇸', name: 'Serbia' },
            { code: 'ua', flag: '🇺🇦', name: 'Ukraine' },
            { code: 'kz', flag: '🇰🇿', name: 'Kazakhstan' },
            { code: 'tw', flag: '🇹🇼', name: 'Taiwan' },
            { code: 'pk', flag: '🇵🇰', name: 'Pakistan' },
            { code: 'bd', flag: '🇧🇩', name: 'Bangladesh' },
            { code: 'mn', flag: '🇲🇳', name: 'Mongolia' },
            { code: 'tt', flag: '🇹🇹', name: 'Trinidad & Tobago' },
            { code: 'jo', flag: '🇯🇴', name: 'Jordan' },
            { code: 'gh', flag: '🇬🇭', name: 'Ghana' },
            { code: 'tz', flag: '🇹🇿', name: 'Tanzania' },
            { code: 'ge', flag: '🇬🇪', name: 'Georgia' },
            { code: 'az', flag: '🇦🇿', name: 'Azerbaijan' },
            { code: 'cy', flag: '🇨🇾', name: 'Cyprus' },
            { code: 'is', flag: '🇮🇸', name: 'Iceland' },
            { code: 'lu', flag: '🇱🇺', name: 'Luxembourg' },
            { code: 'ec', flag: '🇪🇨', name: 'Ecuador' },
        ],
    },
    {
        label: 'Tier E — Copper',
        color: '#B87333',
        countries: [
            { code: 'bo', flag: '🇧🇴', name: 'Bolivia' },
            { code: 'py', flag: '🇵🇾', name: 'Paraguay' },
            { code: 'gt', flag: '🇬🇹', name: 'Guatemala' },
            { code: 'do', flag: '🇩🇴', name: 'Dominican Rep.' },
            { code: 'hn', flag: '🇭🇳', name: 'Honduras' },
            { code: 'sv', flag: '🇸🇻', name: 'El Salvador' },
            { code: 'ni', flag: '🇳🇮', name: 'Nicaragua' },
            { code: 'jm', flag: '🇯🇲', name: 'Jamaica' },
            { code: 'gy', flag: '🇬🇾', name: 'Guyana' },
            { code: 'sr', flag: '🇸🇷', name: 'Suriname' },
            { code: 'ba', flag: '🇧🇦', name: 'Bosnia & Herz.' },
            { code: 'me', flag: '🇲🇪', name: 'Montenegro' },
            { code: 'mk', flag: '🇲🇰', name: 'N. Macedonia' },
            { code: 'al', flag: '🇦🇱', name: 'Albania' },
            { code: 'md', flag: '🇲🇩', name: 'Moldova' },
            { code: 'iq', flag: '🇮🇶', name: 'Iraq' },
            { code: 'na', flag: '🇳🇦', name: 'Namibia' },
            { code: 'ao', flag: '🇦🇴', name: 'Angola' },
            { code: 'mz', flag: '🇲🇿', name: 'Mozambique' },
            { code: 'et', flag: '🇪🇹', name: 'Ethiopia' },
            { code: 'ci', flag: '🇨🇮', name: "Côte d'Ivoire" },
            { code: 'sn', flag: '🇸🇳', name: 'Senegal' },
            { code: 'bw', flag: '🇧🇼', name: 'Botswana' },
            { code: 'zm', flag: '🇿🇲', name: 'Zambia' },
            { code: 'ug', flag: '🇺🇬', name: 'Uganda' },
            { code: 'cm', flag: '🇨🇲', name: 'Cameroon' },
            { code: 'kh', flag: '🇰🇭', name: 'Cambodia' },
            { code: 'lk', flag: '🇱🇰', name: 'Sri Lanka' },
            { code: 'uz', flag: '🇺🇿', name: 'Uzbekistan' },
            { code: 'la', flag: '🇱🇦', name: 'Laos' },
            { code: 'np', flag: '🇳🇵', name: 'Nepal' },
            { code: 'dz', flag: '🇩🇿', name: 'Algeria' },
            { code: 'tn', flag: '🇹🇳', name: 'Tunisia' },
            { code: 'mt', flag: '🇲🇹', name: 'Malta' },
            { code: 'bn', flag: '🇧🇳', name: 'Brunei' },
            { code: 'rw', flag: '🇷🇼', name: 'Rwanda' },
            { code: 'mg', flag: '🇲🇬', name: 'Madagascar' },
            { code: 'pg', flag: '🇵🇬', name: 'Papua New Guinea' },
            { code: 'tm', flag: '🇹🇲', name: 'Turkmenistan' },
            { code: 'kg', flag: '🇰🇬', name: 'Kyrgyzstan' },
            { code: 'mw', flag: '🇲🇼', name: 'Malawi' },
        ],
    },
];

/* ── Structured Data ────────────────────────────────────────────── */
function GlossaryJsonLd({ termCount, terms }: { termCount: number, terms: any[] }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: 'Heavy Haul & Oversize Load Glossary',
        description: `The definitive glossary of ${termCount}+ heavy haul, pilot car, and oversize load terms used across 120 countries.`,
        url: 'https://www.haulcommand.com/glossary',
        publisher: {
            '@type': 'Organization',
            name: 'Haul Command',
            url: 'https://www.haulcommand.com',
        },
        inLanguage: 'en',
        hasDefinedTerm: terms.slice(0, 50).map((t) => ({
            '@type': 'DefinedTerm',
            name: t.term,
            description: t.short_definition || '',
            url: `https://www.haulcommand.com/glossary/${t.slug}`
        }))
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default async function GlossaryHubPage() {
    const supabase = await createClient();

    // Fetch featured terms & total count
    const { data: terms, count: totalTermsValue } = await supabase
        .from('glossary_public')
        .select('*', { count: 'exact' })
        .order('snippet_priority', { ascending: false })
        .limit(100);

    // Fetch recently updated terms for freshness signal
    const { data: recentlyUpdated } = await supabase
        .from('glossary_public')
        .select('term, slug, updated_at')
        .order('updated_at', { ascending: false })
        .limit(6);

    // Group terms by first letter for A-Z sections
    const termsByLetter: Record<string, typeof terms> = {};
    if (terms) {
        terms.forEach((t) => {
            const letter = (t.term?.[0] || '#').toUpperCase();
            if (!termsByLetter[letter]) termsByLetter[letter] = [];
            termsByLetter[letter]!.push(t);
        });
    }

    const totalTerms = totalTermsValue || 0;

    return (
        <div className="min-h-[100dvh] bg-[#0B0B0C] text-white">
            <GlossaryJsonLd termCount={totalTerms} terms={terms || []} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">

                {/* ══════════ HERO ══════════ */}
                <ScrollReveal className="text-center mb-10 relative z-10">
                    <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none" aria-hidden="true">
                        <div className="w-[500px] h-[300px] rounded-full bg-[#D4A844]/[0.06] blur-[120px]" />
                    </div>

                    <div className="inline-flex items-center gap-2 bg-[#D4A844]/10 border border-[#D4A844]/20 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#D4A844] animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#D4A844]">
                            Verified Terms Expanding
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A844] via-[#e8c36a] to-[#D4A844]">
                            Heavy Haul & Pilot Car
                        </span>{' '}
                        Glossary
                    </h1>
                    <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-8 font-medium leading-relaxed">
                        The definitive dictionary of terms, slang, regulations, and acronyms for the pilot car and oversize load industry — actively expanding across our <strong className="text-white/70">120-country framework</strong>.
                    </p>

                    {/* Live Search */}
                    <GlossarySearch terms={(terms || []).map(t => ({ slug: t.slug, term: t.term, short_definition: t.short_definition || '', category: t.category || '' }))} />
                </ScrollReveal>

                {/* ══════════ QUICK ORIENTATION BLOCK ══════════ */}
                <ScrollReveal delay={100} className="mb-14">
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8">
                        <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-5 flex items-center gap-2">
                            <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                            Start Here If You Are:
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/glossary/topics/pilot-car" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                                <span className="text-2xl">🚗</span>
                                <div>
                                    <span className="block font-bold text-white text-sm">An Operator</span>
                                    <span className="text-xs text-white/40 font-medium">PEVO terms & certs</span>
                                </div>
                            </Link>
                            <Link href="/glossary/topics/broker" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                                <span className="text-2xl">🤝</span>
                                <div>
                                    <span className="block font-bold text-white text-sm">A Broker</span>
                                    <span className="text-xs text-white/40 font-medium">Rates & negotiation</span>
                                </div>
                            </Link>
                            <Link href="/glossary/topics/carrier" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                                <span className="text-2xl">🚛</span>
                                <div>
                                    <span className="block font-bold text-white text-sm">A Carrier</span>
                                    <span className="text-xs text-white/40 font-medium">Clearance & routes</span>
                                </div>
                            </Link>
                            <Link href="/glossary/topics/shipper" className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all">
                                <span className="text-2xl">📦</span>
                                <div>
                                    <span className="block font-bold text-white text-sm">A Shipper</span>
                                    <span className="text-xs text-white/40 font-medium">Load types & rules</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ══════════ STATS BAR ══════════ */}
                <ScrollReveal delay={100} className="mb-10">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-center">
                        {[
                            { value: totalTerms, suffix: '+', label: 'Terms Defined' },
                            { value: 120, suffix: '', label: 'Countries Covered' },
                            { value: 12, suffix: '', label: 'Topic Categories' },
                            { value: 26, suffix: '', label: 'A-Z Letters' },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3">
                                <span className="text-2xl md:text-3xl font-black text-[#D4A844] tabular-nums">
                                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                </span>
                                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold text-left leading-tight">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* ══════════ STICKY A-Z NAV ══════════ */}
                <StickyAlphabetNav />

                {/* ══════════ BROWSE BY TOPIC ══════════ */}
                <ScrollReveal delay={150} className="mb-14">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-5 px-1 flex items-center gap-2">
                        <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                        Browse by Topic
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {TOPIC_CATEGORIES.map((cat, idx) => (
                            <ScrollReveal key={cat.slug} delay={60 * idx}>
                                <Link
                                    href={`/glossary/${cat.slug}`}
                                    aria-label={`Browse ${cat.label}`}
                                    className="group relative bg-[#121214] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4A844]/30 transition-all duration-300 flex flex-col items-center shadow-lg hover:shadow-[0_0_24px_rgba(212,168,68,0.12)] hover:-translate-y-1"
                                >
                                    <div className={`h-20 w-full bg-gradient-to-tr ${cat.gradient} relative`}>
                                        <span className="absolute inset-0 flex items-center justify-center text-3xl opacity-80 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">{cat.emoji}</span>
                                    </div>
                                    <div className="p-3 text-center w-full bg-[#15151A]">
                                        <h3 className="text-xs md:text-sm font-bold text-white mb-0.5 group-hover:text-[#D4A844] transition-colors">{cat.label}</h3>
                                        <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold">{cat.sub}</p>
                                    </div>
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-[#D4A844]/[0.04] to-transparent" />
                                </Link>
                            </ScrollReveal>
                        ))}
                    </div>
                </ScrollReveal>

                {/* ═════════ SMART PAYWALL NUDGE ════════ */}
                <div className="mb-14">
                    <SmartPaywallBannerAnon surface="glossary" />
                </div>

                {/* ══════════ BROWSE BY COUNTRY ══════════ */}
                <ScrollReveal delay={100} className="mb-14">
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-5 px-1 flex items-center gap-2">
                        <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                        Browse by Country
                        <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[#D4A844]/80 ml-1">Rolling Coverage</span>
                    </h2>
                    {COUNTRY_TIERS.map((tier) => (
                        <div key={tier.label} className="mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] mb-3 pl-1" style={{ color: tier.color }}>
                                {tier.label}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tier.countries.slice(0, 15).map((c) => (
                                    <Link
                                        key={c.code}
                                        href={`/glossary/${c.code}`}
                                        className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06] hover:border-white/15 transition-all duration-200 group"
                                    >
                                        <span className="text-lg group-hover:scale-110 transition-transform">{c.flag}</span>
                                        <span className="text-white/60 font-medium group-hover:text-white/90 transition-colors text-xs">{c.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </ScrollReveal>

                {/* ══════════ RECENTLY UPDATED (FRESHNESS SIGNAL) ══════════ */}
                {recentlyUpdated && recentlyUpdated.length > 0 && (
                    <ScrollReveal delay={90} className="mb-14">
                        <div className="bg-[#121214] border border-[#D4A844]/20 rounded-3xl p-6 md:p-8">
                            <h2 className="text-[11px] font-black tracking-[0.2em] text-[#D4A844] uppercase mb-5 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#D4A844] animate-pulse" />
                                Recently Updated
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recentlyUpdated.map((rt) => (
                                    <Link key={rt.slug} href={`/glossary/${rt.slug}`} className="block group">
                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all group-hover:border-[#D4A844]/30">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-bold text-white text-sm group-hover:text-[#D4A844]">{rt.term}</h3>
                                                <span className="text-[9px] text-white/30 font-mono">
                                                    {new Date(rt.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* ══════════ SEO INTERLINKING SECTION ══════════ */}
                <ScrollReveal delay={80} className="mb-14">
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-6 md:p-8">
                        <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-5 flex items-center gap-2">
                            <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                            Related Resources
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link href="/directory" className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-[#D4A844]/20 hover:bg-white/[0.05] transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">📋</span>
                                    <h3 className="font-bold text-white group-hover:text-[#D4A844] transition-colors">Operator Directory</h3>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed">Find verified pilot car operators and escort vehicles in your area. 120 countries.</p>
                            </Link>
                            <Link href="/requirements" className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-[#D4A844]/20 hover:bg-white/[0.05] transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">📜</span>
                                    <h3 className="font-bold text-white group-hover:text-[#D4A844] transition-colors">State Regulations</h3>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed">Every state and country's pilot car requirements, permit rules, and legal thresholds.</p>
                            </Link>
                            <Link href="/blog" className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-[#D4A844]/20 hover:bg-white/[0.05] transition-all">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">📰</span>
                                    <h3 className="font-bold text-white group-hover:text-[#D4A844] transition-colors">Industry Blog</h3>
                                </div>
                                <p className="text-white/40 text-sm leading-relaxed">Expert guides, industry news, and how-to articles for heavy haul professionals.</p>
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ══════════ AI SEARCH ANSWER BLOCK ══════════ */}
                <ScrollReveal delay={60} className="mb-14">
                    <div className="max-w-3xl mx-auto">
                        <StaticAnswerBlock
                            question="What is a pilot car in heavy haul trucking?"
                            answer="A pilot car (also called an escort vehicle or lead car) is a vehicle that travels ahead of or behind an oversize or overweight load to warn other drivers, monitor clearances, and ensure safe passage. Requirements for pilot cars vary by state and country, with most jurisdictions requiring escorts for loads exceeding specific width, height, or length thresholds."
                            source="Haul Command Glossary"
                            sourceUrl="https://www.haulcommand.com/glossary/pilot-car"
                            lastVerified="2026-04-03"
                            confidence="verified_current"
                            ctaLabel="Browse All 3,000+ Terms"
                            ctaUrl="/glossary"
                        />
                    </div>
                </ScrollReveal>

                {/* ══════════ AdGrid — Glossary Mid ══════════ */}
                <div className="mb-10">
                    <AdGridSlot zone="glossary_mid" />
                </div>

                {/* ══════════ TERMS GRID BY LETTER ══════════ */}
                <div>
                    <h2 className="text-[11px] font-black tracking-[0.2em] text-white/40 uppercase mb-6 px-1 flex items-center gap-2">
                        <span className="w-8 h-px bg-gradient-to-r from-[#D4A844] to-transparent" />
                        All Terms A-Z
                    </h2>

                    {Object.entries(termsByLetter)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([letter, letterTerms]) => (
                            <div key={letter} id={`letter-${letter}`} data-letter={letter} className="mb-12 scroll-mt-20">
                                {/* Letter heading */}
                                <div className="flex items-center gap-4 mb-5">
                                    <span className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-[#D4A844] to-[#b8892c]">
                                        {letter}
                                    </span>
                                    <div className="flex-1 h-px bg-gradient-to-r from-[#D4A844]/30 to-transparent" />
                                    <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                                        {letterTerms?.length || 0} terms
                                    </span>
                                </div>

                                {/* Term cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {letterTerms?.map((t, idx) => (
                                        <ScrollReveal key={t.slug} delay={Math.min(idx * 40, 200)}>
                                            <Link href={`/glossary/${t.slug}`} className="block group h-full">
                                                <div className="bg-[#121214] border border-white/5 rounded-2xl p-5 h-full transition-all duration-300 group-hover:bg-[#1A1A1E] group-hover:border-[#D4A844]/25 group-hover:-translate-y-0.5 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
                                                    {/* Accent bar */}
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-white/[0.04] group-hover:bg-gradient-to-b group-hover:from-[#D4A844] group-hover:to-[#D4A844]/30 transition-all duration-300" />

                                                    <h3 className="text-base font-bold text-white group-hover:text-[#D4A844] transition-colors flex items-center justify-between pl-3">
                                                        <span className="line-clamp-1">{t.term}</span>
                                                        <span className="text-white/15 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-[-4px] text-lg">→</span>
                                                    </h3>

                                                    {t.category && (
                                                        <span className="inline-block mt-2 ml-3 text-[9px] uppercase font-black tracking-widest text-white/25 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06] group-hover:border-[#D4A844]/15 group-hover:text-[#D4A844]/50 transition-colors">
                                                            {t.category}
                                                        </span>
                                                    )}

                                                    <p className="text-white/45 text-sm mt-3 line-clamp-2 leading-relaxed pl-3">
                                                        {t.short_definition}
                                                    </p>

                                                    {/* Bottom SEO interlinks */}
                                                    {t.related_terms && (
                                                        <div className="mt-3 pt-3 border-t border-white/[0.04] pl-3 flex flex-wrap gap-1">
                                                            {(Array.isArray(t.related_terms) ? t.related_terms : []).slice(0, 3).map((rt: string) => (
                                                                <span key={rt} className="text-[9px] text-white/20 bg-white/[0.02] px-1.5 py-0.5 rounded">
                                                                    {rt}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* ══════════ AdGrid — Glossary Bottom ══════════ */}
                <div className="mt-10 mb-4">
                    <AdGridSlot zone="glossary_bottom" />
                </div>

                {/* ══════════ BOTTOM CTA BANNER ══════════ */}
                <ScrollReveal delay={100}>
                    <div className="mt-16 rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0C] via-[#1a1520] to-[#0B0B0C]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,168,68,0.08)_0%,_transparent_70%)]" />
                        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                                    Need a Pilot Car <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4A844] to-orange-400">That Goes The Distance?</span>
                                </h2>
                                <p className="text-white/60 font-medium text-sm md:text-base">Find verified, professional escort vehicles exactly where your load needs them.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link href="/directory" className="whitespace-nowrap bg-gradient-to-r from-[#D4A844] to-[#b8892c] text-black font-black uppercase tracking-widest text-xs md:text-sm px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(212,168,68,0.35)] transition-all hover:scale-105 text-center">
                                    Search Network
                                </Link>
                                <Link href="/pricing" className="whitespace-nowrap bg-white/5 border border-white/10 text-white/70 font-bold uppercase tracking-widest text-xs md:text-sm px-8 py-4 rounded-xl hover:bg-white/10 hover:text-white transition-all text-center">
                                    View Plans
                                </Link>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Glossary Sponsor Slot ── */}
                <div className="mb-10">
                    <AdGridSlot zone="glossary_sponsor" />
                </div>

                {/* ── Data Teaser Strip ── */}
                <div className="mb-10">
                    <DataTeaserStrip />
                </div>

                {/* ── Snippet Injector — featured snippet capture ── */}
                <SnippetInjector
                  blocks={['definition', 'faq']}
                  term="pilot car"
                  geo="United States"
                  country="US"
                />

                {/* No Dead End — route to high-intent surfaces */}
                <div className="mt-12">
                     <NoDeadEndBlock
                        heading="Not finding what you need? Try these resources:"
                        moves={[
                            { href: '/directory', icon: '🔍', title: 'Find Operators', desc: `Search for pilot car specialists`, primary: true, color: '#22C55E' },
                            { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many escorts do you need?', primary: true, color: '#D4A844' },
                            { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Requirements by state' },
                            { href: '/regulations/us', icon: '🌍', title: 'US Regulations', desc: 'Browse requirements by country' },
                            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Find live pilot cars' },
                            { href: '/pricing', icon: '💲', title: 'All Plans', desc: 'View enterprise fleet plans' },
                        ]}
                    />
                </div>

            </main>
        </div>
    );
}
