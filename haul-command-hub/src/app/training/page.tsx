import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, TrendingUp, Shield, Users, DollarSign, ArrowRight } from 'lucide-react';
import { getTrainingHubPayload } from '@/lib/training/rpc';
import { mapLevelToCardVM } from '@/lib/training/mappers';
import { trainingHubMeta, trainingHubFaqJsonLd } from '@/lib/training/seo';
import TrainingLevelCard from '@/components/training/TrainingLevelCard';
import TrainingRankBenefits from '@/components/training/TrainingRankBenefits';
import TrainingEnterpriseStrip from '@/components/training/TrainingEnterpriseStrip';
import { BADGE_DISCLAIMER } from '@/lib/training/badges';

export const revalidate = 3600;

export const metadata: Metadata = trainingHubMeta() as Metadata;

const WHY_TRAINING = [
  {
    icon: <DollarSign size={22} className="text-yellow-400" />,
    title: 'More Visibility = More Business',
    body: 'Certified and Elite operators rank higher in directory search. Brokers can filter for trained operators. More impressions, more inquiries, more revenue.',
  },
  {
    icon: <Shield size={22} className="text-blue-400" />,
    title: 'Broker-Visible Trust Signals',
    body: 'Your badge shows on every profile and search result. Brokers see it before they contact you. Reduces friction, increases conversion.',
  },
  {
    icon: <TrendingUp size={22} className="text-green-400" />,
    title: 'Measurable Rank Improvement',
    body: 'Training contributes a weighted rank signal. Higher tier = higher weight. The math works in your favor when you compete against untrained operators.',
  },
  {
    icon: <Users size={22} className="text-purple-400" />,
    title: 'Enterprise & Team Paths',
    body: 'Brokers and carriers can buy team seats, track roster completion, and export verification reports. Purpose-built for compliance-minded operations.',
  },
];

export default async function TrainingHubPage() {
  const payload = await getTrainingHubPayload();
  const faqSchema = trainingHubFaqJsonLd();

  // Build level cards
  const levelCards = (payload?.levels ?? [])
    .filter(l => l.level_slug)
    .map(l => mapLevelToCardVM(l, l));

  return (
    <main className="pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-10">
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-300">Training</span>
        </nav>

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-yellow-400 mb-3">
            <GraduationCap size={20} />
            <span className="text-xs font-mono uppercase tracking-widest">Haul Command Training</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Get Certified.<br />
            <span className="text-yellow-400">Rank Higher. Win More.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed mb-6">
            Haul Command training turns your expertise into visible on-platform credentials.
            Earn badges that improve your directory rank, unlock broker trust filters, and signal
            professionalism before the first call.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/training/levels/certified"
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-colors"
            >
              Get Certified — $149
            </Link>
            <Link
              href="/training/levels/road-ready"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm border border-white/10 transition-colors"
            >
              Start Free Preview
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Quick answer block ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">Quick Answer</div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Haul Command offers four training tiers: <strong className="text-white">Road Ready</strong> ($49),{' '}
            <strong className="text-white">Certified</strong> ($149),{' '}
            <strong className="text-white">Elite</strong> ($29/mo), and{' '}
            <strong className="text-white">AV-Ready</strong> ($199).
            Each tier earns a badge that improves your directory rank and trust visibility.
            These are Haul Command on-platform credentials — not legal licenses.
          </p>
        </div>
      </section>

      {/* ─── Why training makes you more money ───────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Why Training Makes You More Money</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {WHY_TRAINING.map((w) => (
            <div key={w.title} className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
              <div className="mb-3">{w.icon}</div>
              <h3 className="font-bold text-white mb-2">{w.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Choose your level ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Choose Your Level</h2>
          <Link href="/training/compare/all" className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
            Compare all <ArrowRight size={14} />
          </Link>
        </div>
        {levelCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {levelCards.map((level) => (
              <TrainingLevelCard key={level.slug} level={level} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Fallback static cards when DB not seeded */}
            {[
              { slug: 'road-ready', name: 'Road Ready', price: '$49', badge: '🛡️', rankPct: '+10%' },
              { slug: 'certified',  name: 'Certified',  price: '$149', badge: '🥇', rankPct: '+25%', popular: true },
              { slug: 'elite',      name: 'Elite',      price: '$29/mo', badge: '⭐', rankPct: '+45%' },
              { slug: 'av-ready',   name: 'AV-Ready',   price: '$199', badge: '🤖', rankPct: '+35%' },
            ].map((l) => (
              <Link
                key={l.slug}
                href={`/training/levels/${l.slug}`}
                className={`border rounded-xl p-5 text-center hover:border-yellow-500/40 transition-colors ${
                  l.popular ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                <div className="text-3xl mb-2">{l.badge}</div>
                <div className="font-bold text-white mb-1">{l.name}</div>
                <div className="text-yellow-400 font-bold text-lg">{l.price}</div>
                <div className="text-xs text-green-400 mt-1">Rank {l.rankPct}</div>
                {l.popular && (
                  <div className="mt-2 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Most Popular</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Rank benefits ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <TrainingRankBenefits />
      </section>

      {/* ─── Broker confidence ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02]">
          <h2 className="text-xl font-bold text-white mb-3">Broker Confidence Benefits</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            Brokers using Haul Command see your training badge on every search result and profile. Certified and Elite
            operators are eligible for broker-side certification filters — meaning they show up in filtered searches that untrained operators are excluded from.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Badge visible in search results', available: 'Certified+' },
              { label: 'Broker filter eligibility', available: 'Certified+' },
              { label: 'Expanded broker trust card', available: 'Elite only' },
            ].map((b) => (
              <div key={b.label} className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="text-xs text-gray-300 mb-1">{b.label}</div>
                <div className="text-[11px] text-yellow-400 font-semibold">{b.available}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-gray-600">
            Badges explained plainly to brokers. Haul Command does not imply legal certification unless externally verified.
          </p>
        </div>
      </section>

      {/* ─── Jurisdiction fit strip ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
          <h2 className="text-base font-bold text-white mb-2">Jurisdiction Fit &amp; Reciprocity</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-3">
            Haul Command training covers core heavy haul escort knowledge applicable globally. State and country-specific training modules address local requirements.
            Reciprocity and jurisdictional recognition varies — check local regulations for legal requirements.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/training/countries/us" className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors">🇺🇸 United States</Link>
            <Link href="/training/countries/ca" className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors">🇨🇦 Canada</Link>
            <Link href="/training/countries/au" className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors">🇦🇺 Australia</Link>
            <Link href="/training/countries/gb" className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors">🇬🇧 United Kingdom</Link>
            <Link href="/training/countries" className="text-xs px-3 py-1 rounded-full border border-yellow-500/20 text-yellow-400 hover:border-yellow-500/40 transition-colors">All countries →</Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-3xl">
          {[
            {
              q: 'What does a Haul Command badge mean?',
              a: 'Haul Command badges are on-platform credentials awarded for completing training modules. They indicate training completion within the platform and improve directory rank, broker trust, and filter eligibility. They are not legal licenses.',
            },
            {
              q: 'How does training improve my directory rank?',
              a: 'Your training badge adds a weighted component to your overall profile rank. Certified adds 25% weight, Elite adds 45% weight. This is one signal among several — proof, freshness, and response quality also contribute.',
            },
            {
              q: 'Can brokers see my training status?',
              a: 'Yes. Certified and Elite badges are visible to brokers in search results and on your profile. Brokers can also filter for certified-only providers.',
            },
            {
              q: 'Do badges expire?',
              a: 'Elite badges require annual renewal to maintain full rank effects. Expired badges lose their rank contribution. You will receive reminders before expiry.',
            },
            {
              q: 'Is there an enterprise or team option?',
              a: 'Yes. Multi-seat plans are available for brokers, carriers, and dispatch operations. Contact us or see the Enterprise page for details.',
            },
          ].map((faq) => (
            <details key={faq.q} className="border border-white/10 rounded-xl overflow-hidden group">
              <summary className="flex items-center justify-between p-4 cursor-pointer text-white font-medium text-sm hover:bg-white/5 transition-colors list-none">
                {faq.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform text-lg leading-none">›</span>
              </summary>
              <div className="px-4 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Trust / confidence block ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className="border border-white/5 rounded-xl p-5 bg-white/[0.01]">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">Credential Transparency</div>
          <p className="text-xs text-gray-500 leading-relaxed">{BADGE_DISCLAIMER}</p>
        </div>
      </section>

      {/* ─── Enterprise strip ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <TrainingEnterpriseStrip />
      </section>

      {/* ─── Related links ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-lg font-bold text-white mb-4">Related</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/escort-requirements', label: 'Escort Requirements' },
            { href: '/tools/permit-checker/us', label: 'Permit Checker' },
            { href: '/tools/escort-rules/us', label: 'Escort Rule Finder' },
            { href: '/glossary', label: 'HC Glossary' },
            { href: '/directory', label: 'Operator Directory' },
            { href: '/claim', label: 'Claim Your Profile' },
            { href: '/pricing', label: 'Pricing' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
