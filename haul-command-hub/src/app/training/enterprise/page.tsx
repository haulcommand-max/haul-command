import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Users, Download, Key, BarChart3, Globe2, Check } from 'lucide-react';
import { trainingEnterpriseMeta } from '@/lib/training/seo';

export const revalidate = 86400;

export const metadata: Metadata = trainingEnterpriseMeta() as Metadata;

const TEAM_FEATURES = [
  { icon: <Users size={18} className="text-yellow-400" />,     title: 'Multi-seat Training',       body: 'Purchase seats for your entire team. Everyone trains under your company account.' },
  { icon: <BarChart3 size={18} className="text-blue-400" />,   title: 'Company Dashboard',         body: 'Track completion status, badge state, and review-due alerts for every team member.' },
  { icon: <Download size={18} className="text-green-400" />,   title: 'Completion Exports',        body: 'Export training completion records and badge verification for audits and compliance docs.' },
  { icon: <Key size={18} className="text-purple-400" />,       title: 'Badge Verification API',    body: 'Programmatically verify badge status for operators in your systems or TMS integrations.' },
  { icon: <Globe2 size={18} className="text-orange-400" />,    title: 'Jurisdiction Fit Overlays', body: 'See training relevance scores for your operational geographies.' },
  { icon: <Building2 size={18} className="text-gray-400" />,   title: 'Private Cohorts',           body: 'Enterprise accounts can run private training cohorts for onboarding and compliance programs.' },
];

const PLANS = [
  {
    slug: 'team',
    name: 'Team Plan',
    tagline: 'For small to mid-size operations',
    seats: '2–49 seats',
    pricing: 'Per-seat pricing',
    priceNote: 'Annual contract',
    features: [
      'All Certified training included',
      'Company dashboard',
      'Roster tracking',
      'Completion status tracking',
      'Basic completion export',
      'Badge visibility in Haul Command',
    ],
    cta: 'Get a Quote',
    ctaHref: '/training/enterprise#contact',
    highlight: false,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    tagline: 'For large operations and brokers',
    seats: '50+ seats',
    pricing: 'Custom contract',
    priceNote: 'Setup fee + annual renewal',
    features: [
      'All tiers including Elite and AV-Ready',
      'Company dashboard + custom reporting',
      'Full completion export & audit logs',
      'Badge verification API',
      'Jurisdiction fit overlays',
      'Private cohorts',
      'SLA + dedicated onboarding',
    ],
    cta: 'Contact Sales',
    ctaHref: '/training/enterprise#contact',
    highlight: true,
  },
];

export default function TrainingEnterprisePage() {
  return (
    <main className="pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/training" className="hover:text-white">Training</Link>
          <span>/</span>
          <span className="text-gray-300">Enterprise</span>
        </nav>

        {/* Hero */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs text-yellow-400 uppercase tracking-widest font-mono mb-3">Enterprise &amp; Teams</div>
          <h1 className="text-4xl font-black text-white mb-4">
            Training at Scale for Brokers, Carriers &amp; Dispatch Operations
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-6">
            Multi-seat training plans with company dashboards, roster tracking, badge verification API, and
            completion exports. Purpose-built for operations that need team-wide compliance visibility.
          </p>
          <div className="flex items-center gap-3">
            <a href="#contact" className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition-colors">
              Get a Quote
            </a>
            <a href="#plans" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-sm border border-white/10 transition-colors">
              See Plans
            </a>
          </div>
        </div>

        {/* Features grid */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-white mb-6">What&apos;s Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM_FEATURES.map((f) => (
              <div key={f.title} className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section id="plans" className="mb-14 scroll-mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.slug}
                className={`border rounded-xl p-6 ${
                  plan.highlight
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">Recommended</div>
                )}
                <h3 className="text-xl font-black text-white mb-1">{plan.name}</h3>
                <div className="text-sm text-gray-400 mb-1">{plan.tagline}</div>
                <div className="text-sm text-gray-500 mb-4">{plan.seats} · {plan.priceNote}</div>
                <div className="text-lg font-bold text-yellow-400 mb-5">{plan.pricing}</div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                <a
                  href={plan.ctaHref}
                  className={`block w-full py-3 rounded-lg font-bold text-sm text-center transition-colors ${
                    plan.highlight
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section className="border border-white/10 rounded-xl p-6 bg-white/[0.02] mb-14">
          <h2 className="text-lg font-bold text-white mb-4">Who Uses Enterprise Training</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'Heavy Haul Brokers',       use: 'Verify certified operators in your network. Filter search results for trained providers.' },
              { role: 'Carriers & Fleet Ops',     use: 'Ensure every escort operator in your fleet has verified, current training on record.' },
              { role: 'Dispatch Operations',      use: 'Track completion status across your dispatch roster. Export records for compliance audits.' },
            ].map((u) => (
              <div key={u.role} className="p-4 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="text-sm font-bold text-white mb-1">{u.role}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{u.use}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact form anchor */}
        <section id="contact" className="border border-yellow-500/20 rounded-xl p-8 bg-yellow-500/5 scroll-mt-8">
          <h2 className="text-2xl font-black text-white mb-2">Get a Quote</h2>
          <p className="text-gray-400 mb-6">
            Tell us about your team size and operational context. We&apos;ll put together a proposal.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 max-w-xl">
            <input
              type="text"
              placeholder="Company name"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
            <input
              type="email"
              placeholder="Your email"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
            <input
              type="text"
              placeholder="Team size (approx. seats)"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
            <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-400 focus:outline-none focus:border-yellow-500/50">
              <option value="">Role / operation type</option>
              <option>Broker</option>
              <option>Carrier</option>
              <option>Dispatcher</option>
              <option>Government / Authority</option>
              <option>Other</option>
            </select>
          </div>
          <Link
            href="/contact?subject=enterprise-training"
            className="inline-flex px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-colors"
          >
            Send Inquiry
          </Link>
        </section>

        {/* Related */}
        <div className="mt-8 flex flex-wrap gap-2">
          {[
            { href: '/training', label: 'All Training' },
            { href: '/training/compare/team', label: 'Compare Plans' },
            { href: '/pricing', label: 'Haul Command Pricing' },
            { href: '/directory', label: 'Directory' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
