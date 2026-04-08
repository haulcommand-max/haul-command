/**
 * app/loads/[type]/page.tsx
 * Haul Command — Dynamic Load Type Intelligence Hub
 *
 * Captures search intent for:
 *   /loads/wind-energy
 *   /loads/transformers
 *   /loads/mining-equipment
 *   /loads/aerospace
 *   /loads/cranes
 *   /loads/modular-homes
 *   (+ any future slug)
 *
 * Server-side fetches real operator count from Supabase.
 * Outputs JSON-LD for Course + FAQPage.
 * Links internally to: directory, corridors, regulations, glossary.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import GlobalBreadcrumbs from '@/components/seo/GlobalBreadcrumbs';
import QuickAnswerBlock from '@/components/seo/QuickAnswerBlock';
import { buildFaqJsonLd } from '@/lib/seo/metadata';

// ─── Load type registry ───────────────────────────────────────────────────────
interface LoadTypeEntry {
  title: string;
  description: string;
  quickAnswer: string;
  fullAnswer: string;
  escortReq: string;
  permitNote: string;
  typicalWidth?: string;
  typicalWeight?: string;
  faqs: { question: string; answer: string }[];
  relatedCorridors: string[];
  relatedGlossary: string[];
  relatedRegulations: string[];
}

const LOAD_TYPE_REGISTRY: Record<string, LoadTypeEntry> = {
  'wind-energy': {
    title: 'Wind Energy Transport',
    description: 'Pilot car requirements and escort logistics for wind turbine blade, nacelle, and tower section transport.',
    quickAnswer: 'Wind turbine blade transport requires 2–4 escort vehicles depending on blade length, state regulations, and corridor restrictions. Blades can exceed 200 feet in length and require specialized trailing steerable dollies.',
    fullAnswer: 'Wind energy component transport is among the most complex oversize load categories. Rotor blades typically exceed 160–200 ft in length and require a leading escort, trailing escort, and in many states a police escort through municipalities. Nacelle and tower section moves are wide-load challenges, often exceeding 18 ft in width. Every corridor has different night-move, holiday-move, and daylight-only restrictions that must be verified per transit state.',
    escortReq: '2–4 escorts depending on blade length and state DOT requirements',
    permitNote: 'Multi-state permit coordination required. Contact each state DOT for wind energy pilot car rules.',
    typicalWidth: '14–18 ft',
    typicalWeight: '80,000–150,000 lbs',
    faqs: [
      { question: 'How many pilot cars does a wind blade move require?', answer: 'Most states require a minimum of 2 pilot cars for blades over 130 ft. Some states mandate police escort through municipalities.' },
      { question: 'Can wind blades travel at night?', answer: 'Night moves are restricted in most states for oversize wind energy loads. Always check the specific state DOT guidelines for the transit corridor.' },
      { question: 'What certifications do pilot car operators need for wind energy moves?', answer: 'Most states require a valid pilot car escort certification and high-visibility equipment. Some states require additional training for superload escorts.' },
    ],
    relatedCorridors: ['texas-panhandle', 'iowa-wind-corridor', 'wyoming-to-california'],
    relatedGlossary: ['pilot-car', 'superload', 'escorted-move', 'trailing-steerable'],
    relatedRegulations: ['/regulations/us/tx', '/regulations/us/ia', '/regulations/us/wy'],
  },
  'transformers': {
    title: 'Power Transformer Transport',
    description: 'Escort and pilot car requirements for extra-high-voltage transformer and substation equipment transport.',
    quickAnswer: 'Power transformer moves are classified as superloads and require extensive advance notice (30–90 days), bridge surveys, utility coordination, and dedicated police escorts. Weight can exceed 1 million lbs.',
    fullAnswer: 'Power transformers are critical infrastructure components that rank among the heaviest industrial loads transported on public roads. Units can weigh between 200,000 and 1,200,000 lbs, requiring multi-axle specialized trailers, route surveys, bridge load studies, and advance coordination with utilities to raise or lower powerlines. Pilot car operators must be certified for superload escort work. Many moves require daily briefings with state DOT coordinators.',
    escortReq: 'Minimum 2 pilot cars + police escort through urban corridors. Superload classification requires full state DOT coordination.',
    permitNote: 'Superload permit required. 30–90 day advance notice required in most states.',
    typicalWidth: '16–28 ft',
    typicalWeight: '200,000–1,200,000 lbs',
    faqs: [
      { question: 'What is a superload?', answer: 'A superload is a shipment exceeding standard permit dimensions or weights requiring special state DOT authorization, route surveys, and escort requirements beyond standard oversize rules.' },
      { question: 'How far in advance must transformer moves be planned?', answer: 'Most states require 30 to 90 days advance notice for superload transformer moves. Some high-priority corridor states may accommodate shorter windows with additional fees.' },
      { question: 'Do power transformer pilots need special certification?', answer: 'Yes. Superload escorts often require state-specific certification beyond standard pilot car licensing. Haul Command surface operators with verified superload certification.' },
    ],
    relatedCorridors: ['gulf-coast-industrial', 'midwest-utility-corridor'],
    relatedGlossary: ['superload', 'pilot-car', 'route-survey', 'bridge-loading'],
    relatedRegulations: ['/regulations/us', '/regulations/ca'],
  },
  'mining-equipment': {
    title: 'Mining Equipment Transport',
    description: 'Pilot car escort requirements for haul trucks, excavators, draglines, and processing equipment.',
    quickAnswer: 'Mining equipment transport including excavators and haul trucks often exceeds 20 ft in width and requires disassembly, specialized lowboy trailers, multi-escort configurations, and state permits.',
    fullAnswer: 'Surface and underground mining equipment creates some of the largest and heaviest oversize transport challenges. Cat 797 haul trucks, large excavators, and dragline components require multi-state route planning, possible disassembly into subloads, specialized modular trailer configurations, and verified pilot car operators who understand tail swing and wide-load distance management.',
    escortReq: '2–4+ escorts depending on width. Wide loads over 16 ft may require police escort.',
    permitNote: 'Width and weight permits required per state. Annual blanket permits may apply for repeat corridor routes.',
    typicalWidth: '16–26 ft',
    typicalWeight: '80,000–500,000 lbs',
    faqs: [
      { question: 'What types of mining equipment require pilot cars?', answer: 'Haul trucks, large excavators, draglines, ball mills, SAG mills, and any mining component exceeding state legal width or height limits require pilot car escort.' },
      { question: 'Can mining equipment be transported at night?', answer: 'Night moves depend on state regulations and load dimensions. Loads over 14.5 ft wide are often restricted to daylight hours.' },
    ],
    relatedCorridors: ['nevada-mining-corridor', 'wyoming-powder-river'],
    relatedGlossary: ['pilot-car', 'superload', 'lowboy', 'escort-vehicle'],
    relatedRegulations: ['/regulations/us/nv', '/regulations/us/wy'],
  },
  'aerospace': {
    title: 'Aerospace & Defense Transport',
    description: 'Escort requirements for aircraft fuselage, rocket sections, military vehicles, and defense hardware transport.',
    quickAnswer: 'Aerospace transport including aircraft fuselage and rocket components requires high-security escort coordination, often involving government agency interaction, controlled corridor timing, and specialized loa protocols.',
    fullAnswer: 'Aerospace and defense transport combines extreme dimension challenges with security and clearance requirements uncommon in civilian logistics. NASA rocket element moves, military vehicle convoys, and aircraft fuselage transport require advance route approval, military or agency liaisons in some cases, and pilot car operators verified for security-sensitive loads. Some corridors require night moves for security. Others are restricted to specific time windows.',
    escortReq: '2–6+ escorts for large aerospace loads. Government or agency liaison may be required.',
    permitNote: 'Coordinated with state DOT and in some cases federal agencies. Security clearance verification may apply.',
    faqs: [
      { question: 'Can any pilot car company escort aerospace loads?', answer: 'Certain aerospace and defense loads require escort operators with security clearance verification or specific agency pre-approval. Haul Command surfaces operators with verified aerospace escort credentials.' },
      { question: 'What makes aerospace transport different from standard oversize moves?', answer: 'Beyond size and weight, aerospace loads may involve controlled timing windows, government liaisons, classified cargo security protocols, and restricted corridor access.' },
    ],
    relatedCorridors: ['kennedy-space-center-corridor', 'edwards-afb-corridor'],
    relatedGlossary: ['pilot-car', 'escort-vehicle', 'superload', 'controlled-move'],
    relatedRegulations: ['/regulations/us/fl', '/regulations/us/ca'],
  },
};

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { type: string } }): Promise<Metadata> {
  const entry = LOAD_TYPE_REGISTRY[params.type];
  const title = entry
    ? `${entry.title} Escort & Pilot Car Requirements | Haul Command`
    : `Heavy Haul Transport Intel — ${params.type.replaceAll('-', ' ')} | Haul Command`;
  const description = entry?.description ?? 'Find qualified certified escort operators for specialized heavy haul transport on Haul Command.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function LoadTypePage({ params }: { params: { type: string } }) {
  const entry = LOAD_TYPE_REGISTRY[params.type];
  const supabase = await createClient();

  // Fetch real operator count for this load type
  const { count: operatorCount } = await supabase
    .from('operator_profiles')
    .select('id', { count: 'exact', head: true })
    .contains('specializations', [params.type])
    .limit(1);

  const faqJsonLd = entry ? buildFaqJsonLd(entry?.faqs ?? []) : null;

  const typeLabel = entry?.title ?? params.type.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        <GlobalBreadcrumbs
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Load Types', href: '/loads' },
            { label: typeLabel, href: `/loads/${params.type}` },
          ]}
        />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            Load Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {typeLabel} — Escort & Pilot Car Requirements
          </h1>
          {entry && (
            <p className="text-gray-400 text-lg max-w-2xl">{entry.description}</p>
          )}

          {/* Key stats strip */}
          {entry && (
            <div className="flex flex-wrap gap-4 mt-6">
              {entry.typicalWidth && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">Typical Width</p>
                  <p className="text-sm font-bold text-white">{entry.typicalWidth}</p>
                </div>
              )}
              {entry.typicalWeight && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-gray-500 mb-0.5">Typical Load Weight</p>
                  <p className="text-sm font-bold text-white">{entry.typicalWeight}</p>
                </div>
              )}
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <p className="text-xs text-gray-500 mb-0.5">Escort Requirement</p>
                <p className="text-sm font-bold text-amber-400">{entry?.escortReq ?? '2+ pilots required'}</p>
              </div>
              {(operatorCount ?? 0) > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                  <p className="text-xs text-amber-400/60 mb-0.5">Verified Operators</p>
                  <p className="text-sm font-bold text-amber-400">{operatorCount}+ available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Answer Block */}
            {entry && (
              <QuickAnswerBlock
                question={`What are the escort requirements for ${typeLabel.toLowerCase()} transport?`}
                shortAnswer={entry.quickAnswer}
                answer={entry.fullAnswer}
                source="Haul Command Load Intelligence"
                confidence="partially_verified"
                lastUpdated="2026-Q1"
                nextStep={{ label: `Find certified ${typeLabel} escort operators →`, href: '/directory' }}
              />
            )}

            {/* Permit note */}
            {entry?.permitNote && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Permit Requirement</p>
                <p className="text-sm text-gray-300">{entry.permitNote}</p>
                <Link href="/tools" className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Use the Permit Research Tool →
                </Link>
              </div>
            )}

            {/* FAQs */}
            {entry?.faqs && entry.faqs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {entry.faqs.map((faq, i) => (
                    <div key={i} className="bg-white/3 border border-white/10 rounded-xl p-5">
                      <p className="text-sm font-semibold text-white mb-2">{faq.question}</p>
                      <p className="text-sm text-gray-400">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Find operators CTA */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
              <p className="text-sm font-bold text-white mb-1">Find certified escort operators</p>
              <p className="text-xs text-gray-400 mb-4">Compare trust scores, certifications, and live availability.</p>
              <Link
                href="/directory"
                className="block text-center py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
              >
                Browse the Directory
              </Link>
            </div>

            {/* Related corridors */}
            {entry?.relatedCorridors && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Common Corridors</p>
                <ul className="space-y-2">
                  {entry.relatedCorridors.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/rates/corridors/${slug}`}
                        className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related glossary */}
            {entry?.relatedGlossary && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Glossary</p>
                <ul className="space-y-2">
                  {entry.relatedGlossary.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/glossary/${slug}`}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regulations */}
            {entry?.relatedRegulations && (
              <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">State Regulations</p>
                <ul className="space-y-2">
                  {entry.relatedRegulations.map((href) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-gray-300 hover:text-white transition-colors">
                        {href.split('/').slice(-1)[0].toUpperCase()} Escort Rules →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        {/* Fallback for unknown load types */}
        {!entry && (
          <div className="mt-10 text-center text-gray-400">
            <p className="text-lg mb-4">We're building out intelligence for this load type.</p>
            <Link href="/directory" className="text-amber-400 hover:text-amber-300 transition-colors">
              Browse all verified escort operators →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
