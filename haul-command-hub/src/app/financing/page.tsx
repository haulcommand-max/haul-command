import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: 'Equipment Financing for Pilot Car Operators — Haul Command',
  description:
    'Get financing for your escort vehicle, height poles, light bars, and safety equipment. Haul Command uses your earnings history — not your credit score — to unlock funding.',
};

export const revalidate = 3600;

const EQUIPMENT_TYPES = [
  { icon: '🚗', label: 'Escort Vehicle', range: '$15K–$85K', term: '24–84 months', note: 'New or used' },
  { icon: '📡', label: 'Height Pole System', range: '$800–$4,500', term: '6–24 months', note: 'Telescoping or fixed' },
  { icon: '💡', label: 'Light Bar Package', range: '$400–$2,000', term: '6–18 months', note: 'LED, amber, strobes' },
  { icon: '📻', label: 'Radio & Comms', range: '$200–$1,200', term: '6–12 months', note: 'CB, VHF, DOT kit' },
  { icon: '🛡️', label: 'Safety Equipment Bundle', range: '$300–$1,800', term: '6–18 months', note: 'Signs, flags, vests' },
  { icon: '🔧', label: 'Vehicle Upfit', range: '$2K–$15K', term: '12–36 months', note: 'Graphics, mounts, rigging' },
];

const LENDER_PARTNERS = [
  { name: 'Pipe', specialty: 'Revenue-based financing', regions: ['US', 'CA', 'AU', 'EU'], logo: '⚡' },
  { name: 'Capchase', specialty: 'Equipment & working capital', regions: ['US', 'EU'], logo: '📈' },
  { name: 'WEX Capital', specialty: 'Fleet & equipment', regions: ['US', 'CA'], logo: '🏦' },
  { name: 'Regional Partners', specialty: 'Local financing, 57 countries', regions: ['Global'], logo: '🌍' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Apply in 2 Min', desc: 'Tell us what equipment you need and how much. No W2 required.', icon: '📋' },
  { step: '2', title: 'Platform Intel Scores You', desc: 'We analyze your earnings, consistency, and completion rate — not your credit score.', icon: '📊' },
  { step: '3', title: 'Pre-Approval in 24h', desc: 'Rate and term offered based on your actual performance data.', icon: '✅' },
  { step: '4', title: 'Funds Released', desc: 'Payment goes direct to the equipment vendor. You keep running.', icon: '💰' },
];

export default async function FinancingPage() {
  const sb = supabaseServer();

  // Aggregate platform stats for social proof
  const { count: verifiedOperators } = await sb
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .not('motive_connected_at', 'is', null);

  const operatorCount = verifiedOperators ?? 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Equipment Financing</span>
        </nav>

        {/* Hero */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-accent text-xs font-bold uppercase tracking-wider">Launch Partner Program</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Financing That Knows<br />
            <span className="text-accent">The Industry</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Banks don't understand irregular income. We do. Haul Command uses your actual
            earnings history, job completion rate, and platform reputation to unlock equipment
            financing that was previously impossible to get.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/financing/apply"
              className="bg-accent text-black px-8 py-3.5 rounded-xl font-black text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
            >
              Apply in 2 Minutes →
            </Link>
            <Link
              href="#how-it-works"
              className="bg-white/5 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
            >
              See How It Works
            </Link>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {[
            { value: `${operatorCount > 0 ? operatorCount.toLocaleString() : '7,335'}+`, label: 'Verified Operators' },
            { value: '57', label: 'Countries Served' },
            { value: '$0', label: 'Application Fee' },
            { value: '24h', label: 'Pre-Approval Time' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center">
              <div className="text-accent font-black text-2xl">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Why This Is Different */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
                Banks See an<br /><span className="text-red-400">Irregular Income</span>
              </h2>
              <p className="text-gray-400 mb-4">
                Traditional lenders look at W2s, credit scores, and debt ratios. None of those metrics
                capture what it means to be a working pilot car operator — consistent runs, repeat clients,
                and a track record that proves reliability.
              </p>
              <div className="space-y-3">
                {[
                  'Banks deny operators with irregular income despite consistent earnings',
                  'Credit scores don\'t reflect professional performance',
                  'Traditional underwriting was never built for the gig economy',
                  'Global operators in emerging markets have almost no financing options',
                ].map(p => (
                  <div key={p} className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                    <span className="text-gray-400 text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
                We See Your<br /><span className="text-accent">Real Track Record</span>
              </h2>
              <p className="text-gray-400 mb-4">
                Every job you run through Haul Command builds a verified performance record — earnings,
                completion rate, escrow history, and client ratings. That's better credit data than any bank
                has access to. We use it to score you, not penalize you.
              </p>
              <div className="space-y-3">
                {[
                  'Earnings intelligence: 12-month verified income from platform jobs',
                  'Completion score: % of jobs completed on time and without disputes',
                  'Consistency index: how regular and predictable your work schedule is',
                  'Reputation score: client ratings, rehire rate, and corridor history',
                ].map(p => (
                  <div key={p} className="flex items-start gap-3">
                    <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
                    <span className="text-gray-400 text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Equipment Types */}
        <section className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">What We Finance</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Everything you need to run a professional escort operation</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EQUIPMENT_TYPES.map(e => (
              <div key={e.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-accent/20 transition-all">
                <div className="text-3xl mb-3">{e.icon}</div>
                <h3 className="text-white font-bold text-base mb-1">{e.label}</h3>
                <div className="text-accent font-black text-lg mb-1">{e.range}</div>
                <div className="text-gray-500 text-xs">{e.term} · {e.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="mb-16">
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 text-center">How It Works</h2>
          <p className="text-gray-500 text-sm text-center mb-10">From application to funded in under 48 hours</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-accent/20 transition-all h-full">
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="text-accent font-black text-xs uppercase tracking-widest mb-2">Step {s.step}</div>
                  <h3 className="text-white font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 text-gray-700 text-lg z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Global Opportunity */}
        <section className="mb-16 bg-gradient-to-r from-blue-500/5 to-transparent border border-blue-500/15 rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">Global Expansion</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-4">
              First Equipment Financing<br />for the Global Escort Industry
            </h2>
            <p className="text-gray-400 mb-6">
              In Brazil, South Africa, India, and Southeast Asia — equipment financing for independent
              operators barely exists. Banks don't understand the industry. We do. We're introducing
              financed equipment access in markets where the only alternative is saving for years or running
              with unsafe gear.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { flag: '🇧🇷', country: 'Brazil', note: 'Launching 2025' },
                { flag: '🇿🇦', country: 'South Africa', note: 'Launching 2025' },
                { flag: '🇮🇳', country: 'India', note: 'Launch partner ready' },
                { flag: '🌏', country: 'Southeast Asia', note: 'Roadmap 2026' },
              ].map(c => (
                <div key={c.country} className="text-center">
                  <div className="text-3xl mb-1">{c.flag}</div>
                  <div className="text-white text-sm font-bold">{c.country}</div>
                  <div className="text-blue-400 text-[10px]">{c.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lender Partners */}
        <section className="mb-16">
          <h2 className="text-2xl font-black text-white tracking-tighter mb-2 text-center">Lending Partners</h2>
          <p className="text-gray-500 text-sm text-center mb-8">We work with specialized lenders who understand the industry</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LENDER_PARTNERS.map(l => (
              <div key={l.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center hover:border-white/[0.12] transition-all">
                <div className="text-4xl mb-2">{l.logo}</div>
                <div className="text-white font-bold text-sm mb-1">{l.name}</div>
                <div className="text-gray-500 text-xs mb-2">{l.specialty}</div>
                <div className="flex flex-wrap gap-1 justify-center">
                  {l.regions.map(r => (
                    <span key={r} className="text-[9px] bg-white/5 text-gray-500 px-2 py-0.5 rounded">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-white font-black text-3xl tracking-tighter mb-3">
            Ready to upgrade your operation?
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
            Apply in 2 minutes. No credit check required for pre-approval. We'll give you an
            honest answer based on your actual performance data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/financing/apply"
              className="bg-accent text-black px-10 py-4 rounded-xl font-black text-base hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
            >
              Apply Now — Free →
            </Link>
            <Link
              href="/pricing"
              className="bg-white/5 text-white px-10 py-4 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/10 transition-colors"
            >
              View Platform Plans
            </Link>
          </div>
          <p className="text-gray-600 text-xs mt-4">Available to Haul Command verified operators only · 57 countries</p>
        </div>
      </main>
    </>
  );
}
