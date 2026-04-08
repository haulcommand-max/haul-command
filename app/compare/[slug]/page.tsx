/**
 * app/compare/[slug]/page.tsx
 * Haul Command — SEO Competitor Comparison Pages
 *
 * Handles:
 *   /compare/us-pilot-cars-vs-haul-command
 *   /compare/oversized-io-vs-haul-command
 *   /compare/that-trucking-vs-haul-command
 *   (+ any future slug)
 */

import { Metadata } from 'next';
import Link from 'next/link';
import GlobalBreadcrumbs from '@/components/seo/GlobalBreadcrumbs';
import { buildFaqJsonLd } from '@/lib/seo/metadata';

interface CompetitorEntry {
  competitorName: string;
  vs: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  verdict: string;
  rows: { feature: string; them: string | boolean; us: string | boolean; notes?: string }[];
  faqs: { question: string; answer: string }[];
  ctaLabel: string;
}

const COMPARE_REGISTRY: Record<string, CompetitorEntry> = {
  'us-pilot-cars-vs-haul-command': {
    competitorName: 'US Pilot Cars',
    vs: 'Haul Command',
    metaTitle: 'US Pilot Cars vs Haul Command — Full Comparison',
    metaDescription: 'Compare US Pilot Cars and Haul Command side by side. See which platform offers better operator verification, load matching, trust scoring, and global coverage.',
    headline: 'US Pilot Cars vs. Haul Command',
    subheadline: 'Directory listings vs. a full dispatch and intelligence OS.',
    verdict: 'US Pilot Cars built a useful directory. Haul Command built a command center — with real-time availability, verified trust scoring, route intelligence, and load matching that replaces phone calls and group chat.',
    rows: [
      { feature: 'Verified operator profiles', them: 'Partial', us: true },
      { feature: 'Trust / composite score', them: false, us: true },
      { feature: 'Live availability broadcasting', them: false, us: true },
      { feature: 'Autonomous load matching', them: false, us: true },
      { feature: 'Corridor rate intelligence', them: false, us: true },
      { feature: 'Country coverage', them: 'US only', us: '120 countries' },
      { feature: 'Mobile-first operator dashboard', them: false, us: true },
      { feature: 'Escrow / payment flow', them: false, us: true },
      { feature: 'Compliance kit & permit tools', them: 'Limited', us: true },
      { feature: 'AdGrid monetization for operators', them: false, us: true },
    ],
    faqs: [
      { question: 'Is Haul Command better than US Pilot Cars?', answer: 'US Pilot Cars is a directory. Haul Command is a full dispatch OS with trust verification, live matching, corridor intelligence, escrow payments, and global coverage across 120 countries.' },
      { question: 'Can I list on both platforms?', answer: 'Yes. Claiming your Haul Command profile is free and takes 2 minutes. Your Haul Command presence includes a trust score and live availability that US Pilot Cars cannot provide.' },
    ],
    ctaLabel: 'Claim your free Haul Command profile',
  },
  'oversized-io-vs-haul-command': {
    competitorName: 'Oversized.io',
    vs: 'Haul Command',
    metaTitle: 'Oversized.io vs Haul Command — Full Platform Comparison',
    metaDescription: 'Comparing Oversized.io and Haul Command for pilot car operators and brokers. Trust, matching, global coverage, and dispatch intelligence compared.',
    headline: 'Oversized.io vs. Haul Command',
    subheadline: 'Two platforms. One clear winner for trust, intelligence, and global reach.',
    verdict: 'Oversized.io serves a valid niche in the US market. Haul Command out-structures it on trust scoring, corridor intelligence, operator verification depth, 120-country scope, and push-notification-driven autonomous dispatching.',
    rows: [
      { feature: 'Operator verification depth', them: 'Basic', us: 'Full trust scoring' },
      { feature: 'Real-time availability', them: 'Partial', us: true },
      { feature: 'Route & corridor intelligence', them: false, us: true },
      { feature: 'AI load matching', them: false, us: true },
      { feature: 'Mobile push notifications', them: false, us: true },
      { feature: 'Global coverage', them: 'US focused', us: '120 countries' },
      { feature: 'Escrow payments', them: false, us: true },
      { feature: 'Permit rule database', them: 'Limited', us: true },
      { feature: 'Broker-side workflow', them: 'Partial', us: true },
      { feature: 'Free to claim', them: 'Paid listing', us: true },
    ],
    faqs: [
      { question: 'How does Haul Command compare to Oversized.io for brokers?', answer: 'Haul Command gives brokers AI-powered operator matching, trust scores visible before contact, escrow, and a verified availability feed. Oversized.io provides a simpler directory with fewer automation layers.' },
      { question: 'Is Haul Command free like Oversized.io?', answer: 'Claiming your profile on Haul Command is free. Premium features like featured placement, corridor sponsorship, and advanced analytics are available at higher tiers.' },
    ],
    ctaLabel: 'Claim your profile — free forever',
  },
  'that-trucking-vs-haul-command': {
    competitorName: 'That Trucking',
    vs: 'Haul Command',
    metaTitle: 'That Trucking vs Haul Command — Which Platform Wins for Heavy Haul?',
    metaDescription: 'Honest comparison of That Trucking vs Haul Command for pilot car operators, brokers, and fleet dispatchers. Features, verification, matching, and global reach.',
    headline: 'That Trucking vs. Haul Command',
    subheadline: 'Social community vs. mission-critical dispatch intelligence.',
    verdict: 'That Trucking excels at community and informal dispatch. Haul Command adds what the community forum cannot: verified trust, autonomous load matching, corridor intelligence, escrow, and a 120-country operating infrastructure.',
    rows: [
      { feature: 'Community Q&A and discussion', them: true, us: true, notes: 'HC also has community threads' },
      { feature: 'Verified operator trust scores', them: false, us: true },
      { feature: 'Autonomous load matching', them: false, us: true },
      { feature: 'Corridor rate intelligence', them: false, us: true },
      { feature: 'Dispatch OS (real-time)', them: false, us: true },
      { feature: 'Mobile push notifications', them: 'App only', us: true },
      { feature: 'Escrow & payment flow', them: false, us: true },
      { feature: 'Permit & regulation database', them: 'User posts', us: 'Verified database' },
      { feature: 'International coverage', them: false, us: '120 countries' },
      { feature: 'Free to claim', them: true, us: true },
    ],
    faqs: [
      { question: 'Is That Trucking better for operators than Haul Command?', answer: 'That Trucking is great for community conversation. Haul Command is built for operations — real availability, load matching, verified profiles, trust scoring, and escrow that group chats cannot provide.' },
      { question: 'Can I use both That Trucking and Haul Command?', answer: 'Absolutely. Many operators use community forums for networking and Haul Command for operational dispatch, verified availability, and matched loads.' },
    ],
    ctaLabel: 'Join 10,000+ operators on Haul Command',
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entry = COMPARE_REGISTRY[params.slug];
  const title = entry?.metaTitle ?? `Compare vs Haul Command | Haul Command`;
  const description = entry?.metaDescription ?? 'See how Haul Command compares to other platforms for heavy haul operators and brokers.';
  return { title, description, openGraph: { title, description }, twitter: { card: 'summary_large_image', title, description } };
}

function CompareRow({ feature, them, us, competitorName, notes }: {
  feature: string;
  them: string | boolean;
  us: string | boolean;
  competitorName: string;
  notes?: string;
}) {
  const renderVal = (val: string | boolean, isUs = false) => {
    if (val === true) return <span className={`text-sm font-semibold ${isUs ? 'text-green-400' : 'text-gray-400'}`}>✓ Yes</span>;
    if (val === false) return <span className="text-sm text-gray-600">✕ No</span>;
    return <span className={`text-sm ${isUs ? 'text-green-400 font-medium' : 'text-gray-400'}`}>{val}</span>;
  };

  return (
    <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-white/5 hover:bg-white/2 transition-colors">
      <div>
        <p className="text-sm text-white">{feature}</p>
        {notes && <p className="text-xs text-gray-500 mt-0.5">{notes}</p>}
      </div>
      <div className="text-center">{renderVal(them)}</div>
      <div className="text-center">{renderVal(us, true)}</div>
    </div>
  );
}

export default function ComparePage({ params }: { params: { slug: string } }) {
  const entry = COMPARE_REGISTRY[params.slug];
  if (!entry) {
    return (
      <main className="min-h-screen bg-[#07090d] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comparison not found</h1>
          <Link href="/directory" className="text-amber-400 hover:text-amber-300 transition-colors">
            Browse the Haul Command directory →
          </Link>
        </div>
      </main>
    );
  }

  const faqJsonLd = buildFaqJsonLd(entry.faqs);

  return (
    <main className="min-h-screen bg-[#07090d] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <GlobalBreadcrumbs
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Compare', href: '/compare' },
            { label: `${entry.competitorName} vs Haul Command`, href: `/compare/${params.slug}` },
          ]}
        />

        {/* Hero */}
        <div className="my-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold mb-4">
            Honest Comparison
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {entry.headline}
          </h1>
          <p className="text-gray-400 text-lg">{entry.subheadline}</p>
        </div>

        {/* Verdict */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-8">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Our Verdict</p>
          <p className="text-sm text-gray-300 leading-relaxed">{entry.verdict}</p>
        </div>

        {/* Comparison table */}
        <div className="rounded-xl border border-white/10 overflow-hidden mb-8">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-white/5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Feature</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center">{entry.competitorName}</p>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest text-center">Haul Command</p>
          </div>
          {entry.rows.map((row, i) => (
            <CompareRow key={i} {...row} competitorName={entry.competitorName} />
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center mb-8">
          <p className="text-lg font-bold text-white mb-1">Ready to upgrade?</p>
          <p className="text-sm text-gray-400 mb-4">{entry.verdict.split('.')[0]}.</p>
          <Link
            href="/claim"
            className="inline-block px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all"
          >
            {entry.ctaLabel}
          </Link>
        </div>

        {/* FAQs */}
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
      </div>
    </main>
  );
}
