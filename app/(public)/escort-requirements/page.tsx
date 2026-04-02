export const dynamic = "force-dynamic";
import { supabaseServer } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import { RouteCalcMobileGate } from '@/components/mobile/gates/RouteCalcMobileGate';

export const metadata: Metadata = {
  title: 'State Escort Requirements for Oversize Loads | Haul Command',
  description:
    'Check pilot car and escort vehicle requirements for all 50 US states. Width, height, length, and weight thresholds that trigger escort requirements — updated in real time.',
  keywords: [
    'state escort requirements',
    'oversize load escort requirements by state',
    'pilot car requirements by state',
    'escort vehicle requirements',
    'oversize load permit requirements',
    'superload escort requirements',
    'wide load escort requirements',
  ],
  openGraph: {
    title: 'State Escort Requirements for Oversize Loads | Haul Command',
    description: 'Pilot car and escort vehicle requirements for all 50 US states. Check width, height, and weight thresholds.',
    url: 'https://haulcommand.com/escort-requirements',
  },
  alternates: {
    canonical: 'https://haulcommand.com/escort-requirements',
  },
};

export const ESCORT_REQUIREMENTS_JSONLD = `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "State Escort Requirements for Oversize Loads",
  "url": "https://haulcommand.com/escort-requirements",
  "description": "Pilot car and escort vehicle requirements for all 50 US states.",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://haulcommand.com" },
      { "@type": "ListItem", "position": 2, "name": "State Escort Requirements", "item": "https://haulcommand.com/escort-requirements" }
    ]
  },
  "about": {
    "@type": "Thing",
    "name": "Oversize Load Escort Requirements",
    "description": "Legal requirements for pilot cars and escort vehicles when transporting oversize loads on public roads in the United States."
  }
}`;

const FLAG: Record<string, string> = { US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦', DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷', IE: '🇮🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭', ES: '🇪🇸', FR: '🇫🇷', IT: '🇮🇹', PT: '🇵🇹', SA: '🇸🇦', QA: '🇶🇦', MX: '🇲🇽', IN: '🇮🇳', ID: '🇮🇩', TH: '🇹🇭', JP: '🇯🇵', KR: '🇰🇷', PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', HR: '🇭🇷', RO: '🇷🇴', BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', KW: '🇰🇼', OM: '🇴🇲', BH: '🇧🇭', SG: '🇸🇬', MY: '🇲🇾', CL: '🇨🇱', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪', VN: '🇻🇳', PH: '🇵🇭', UY: '🇺🇾', PA: '🇵🇦', CR: '🇨🇷' };
const NAME: Record<string, string> = { US: 'United States', CA: 'Canada', AU: 'Australia', GB: 'United Kingdom', NZ: 'New Zealand', ZA: 'South Africa', DE: 'Germany', NL: 'Netherlands', AE: 'UAE', BR: 'Brazil', IE: 'Ireland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland', BE: 'Belgium', AT: 'Austria', CH: 'Switzerland', ES: 'Spain', FR: 'France', IT: 'Italy', PT: 'Portugal', SA: 'Saudi Arabia', QA: 'Qatar', MX: 'Mexico', IN: 'India', ID: 'Indonesia', TH: 'Thailand', JP: 'Japan', KR: 'South Korea', PL: 'Poland', CZ: 'Czechia', SK: 'Slovakia', HU: 'Hungary', SI: 'Slovenia', EE: 'Estonia', LV: 'Latvia', LT: 'Lithuania', HR: 'Croatia', RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', TR: 'Turkey', KW: 'Kuwait', OM: 'Oman', BH: 'Bahrain', SG: 'Singapore', MY: 'Malaysia', CL: 'Chile', AR: 'Argentina', CO: 'Colombia', PE: 'Peru', VN: 'Vietnam', PH: 'Philippines', UY: 'Uruguay', PA: 'Panama', CR: 'Costa Rica' };

interface Jurisdiction { jurisdiction_code: string; jurisdiction_name: string; country_code: string; jurisdiction_type: string; rule_count: number; }

export default async function EscortRequirementsIndex() {
    const supabase = supabaseServer();
    const { data } = await supabase.rpc('hc_list_all_jurisdictions');
    const jurisdictions: Jurisdiction[] = data || [];
    const byCountry: Record<string, Jurisdiction[]> = {};
    for (const j of jurisdictions) { if (!byCountry[j.country_code]) byCountry[j.country_code] = []; byCountry[j.country_code].push(j); }
    const tierA = ['US', 'CA', 'AU', 'GB', 'NZ', 'ZA', 'DE', 'NL', 'AE', 'BR'];
    const countryOrder = Object.keys(byCountry).sort((a, b) => { const ai = tierA.indexOf(a); const bi = tierA.indexOf(b); if (ai !== -1 && bi !== -1) return ai - bi; if (ai !== -1) return -1; if (bi !== -1) return 1; return (NAME[a] || a).localeCompare(NAME[b] || b); });
    const totalJ = jurisdictions.length;
    const totalR = jurisdictions.reduce((s, j) => s + Number(j.rule_count), 0);

    return (
        <RouteCalcMobileGate>
        <main className="flex-grow max-w-7xl mx-auto px-4 py-12 sm:py-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ESCORT_REQUIREMENTS_JSONLD }} />
            {/* FAQPage — capture 'do I need a pilot car in [state]' snippets */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                    { "@type": "Question", "name": "What are escort vehicle requirements for oversize loads?", "acceptedAnswer": { "@type": "Answer", "text": `Escort vehicle (pilot car) requirements vary by jurisdiction. Loads exceeding specific width, height, length, or weight thresholds require one or more escort vehicles. Haul Command covers ${totalJ} jurisdictions across ${countryOrder.length} countries with ${totalR} specific rules.` }},
                    { "@type": "Question", "name": "How many pilot cars do I need for an oversize load?", "acceptedAnswer": { "@type": "Answer", "text": "The number of escort vehicles required depends on load dimensions, route characteristics, and local regulations. Most US states require at least one pilot car for loads exceeding 12-14 feet wide, with two required above 16 feet. Superloads often need police escorts as well." }},
                    { "@type": "Question", "name": "What equipment does a pilot car need?", "acceptedAnswer": { "@type": "Answer", "text": "Standard pilot car equipment includes an 'OVERSIZE LOAD' sign (minimum 5'x10\" with 8\" black letters on yellow), amber rotating/strobe lights, height pole (for lead vehicles), two-way radio or CB radio, flags, and safety equipment. Some states require additional items like flashing arrow boards." }},
                    { "@type": "Question", "name": "Do pilot car drivers need certification?", "acceptedAnswer": { "@type": "Answer", "text": "Many US states require pilot car operators to hold a valid certification. Requirements vary — some states accept other states' certifications (reciprocity), while others require their own specific certification program. Check the Haul Command escort requirements tool for state-by-state details." }},
                    { "@type": "Question", "name": "What triggers the need for an escort vehicle?", "acceptedAnswer": { "@type": "Answer", "text": "Escort vehicles are triggered by load dimensions exceeding legal limits. Common triggers include: width over 10-12 feet, height over 14-15 feet, length over 75-100 feet, or weight requiring a superload permit. Night travel, two-lane roads, and interstate crossings may require additional escorts." }},
                ]
            }) }} />
            <header className="mb-12 sm:mb-16">
                <div className="flex items-center space-x-4 mb-4"><span className="bg-[var(--color-accent)] text-black text-[10px] font-black px-2 py-0.5 rounded italic">GLOBAL COVERAGE</span><span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded italic">{totalJ} JURISDICTIONS</span></div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white italic tracking-tighter">ESCORT <span className="text-[var(--color-accent)] underline decoration-4 underline-offset-4">REQUIREMENTS</span></h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-3xl mt-4">Dimension-based escort rules for oversize loads across {countryOrder.length} countries and {totalJ} jurisdictions. {totalR} rules covering width, height, length, and weight thresholds.</p>
                <Link aria-label="Navigation Link" href="/tools/escort-calculator" className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-black px-6 py-3 rounded-xl font-black text-sm mt-6 hover:bg-white transition-all">🧮 Try the Route Calculator →</Link>
            </header>
            <div className="space-y-12">{countryOrder.map(cc => (
                <section key={cc}>
                    <div className="flex items-center gap-3 mb-6"><span className="text-3xl">{FLAG[cc] || '🌍'}</span><h2 className="text-2xl font-black text-white tracking-tight">{NAME[cc] || cc}</h2><span className="text-gray-500 text-xs font-bold">{byCountry[cc].length} jurisdiction{byCountry[cc].length > 1 ? 's' : ''}</span></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">{byCountry[cc].map(j => (
                        <Link aria-label="Navigation Link" key={j.jurisdiction_code} href={`/escort-requirements/${j.jurisdiction_code.toLowerCase()}`} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[var(--color-accent)]/50 hover:bg-white/10 transition-all group">
                            <p className="text-white font-bold text-sm group-hover:text-[var(--color-accent)] transition-colors">{j.jurisdiction_name}</p>
                            <div className="flex items-center gap-2 mt-2"><span className="text-[10px] text-gray-500 font-black uppercase">{j.jurisdiction_type}</span><span className="text-[10px] text-[var(--color-accent)] font-bold">{j.rule_count} rules</span></div>
                        </Link>
                    ))}</div>
                </section>
            ))}</div>
            <div className="mt-20 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent border border-[var(--color-accent)]/20 rounded-3xl p-8 sm:p-10 text-center">
                <h2 className="text-white font-black text-3xl italic mb-4">Know Before You Roll</h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-6">Stop reading 50 different pages. Enter your load once, see every escort requirement on your entire route.</p>
                <Link aria-label="Navigation Link" href="/tools/escort-calculator" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-black text-lg hover:bg-[var(--color-accent)] transition-all">🧮 ROUTE CALCULATOR — FREE</Link>
            </div>
        </main>
        </RouteCalcMobileGate>
    );
}
