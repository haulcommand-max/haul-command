import { Metadata } from 'next';
import Link from 'next/link';
import { PartnerInquiryForm } from '@/components/partners/PartnerInquiryForm';

export const metadata: Metadata = {
  title: 'Haul Command for Operations Teams — Escort Dispatch Platform | Haul Command',
  description: 'The escort dispatch platform built for AV companies, oilfield operations, wind energy projects, and large carriers. Post once, fill fast. Escrow-protected payments.',
};

const PROBLEMS = [
  'Your dispatcher calls 6 numbers to find one available escort',
  'No way to verify the escort\u2019s insurance before they show up',
  'Payment disputes happen after every other job',
  'No one on the platform knows AV-specific escort protocols',
];

const SOLUTIONS = [
  { icon: '\u26a1', text: 'Post a load in 90 seconds \u2014 matched escorts respond instantly' },
  { icon: '\u2713', text: 'Every operator verified, insured, and rated by previous brokers' },
  { icon: '\ud83e\udd16', text: 'HC AV-Ready certified operators for autonomous truck corridors' },
  { icon: '\ud83d\udd12', text: 'Escrow payment \u2014 funds release on completion, never before' },
  { icon: '\u23f1\ufe0f', text: 'Median fill time: 47 minutes' },
  { icon: '\ud83c\udf0d', text: '57 countries, 219+ corridors covered' },
];

const USE_CASES = [
  {
    id: 'av',
    icon: '\ud83e\udd16',
    headline: 'For Autonomous Vehicle Operations',
    body: 'Your trucks are autonomous. Your escorts need to be AV-Ready. Haul Command\u2019s HC AV-Ready certified operators understand Aurora Driver behavior, Kodiak sensor fields, and the protocols that keep everyone safe when there\u2019s no human in the cab to answer the radio.',
    cta: 'AV-Ready Operator Network',
    href: '/partners/autonomous-vehicles',
  },
  {
    id: 'oilfield',
    icon: '\ud83d\udee2\ufe0f',
    headline: 'For Oilfield Operations',
    body: 'The Permian Basin alone generates 500+ new drilling permits every month. Each rig move needs multiple escorts across FM roads that Google Maps doesn\u2019t know exist. Haul Command has operators in Midland, Odessa, Andrews, and Pecos \u2014 verified, insured, and familiar with oilfield protocols.',
    cta: 'Permian Basin Network',
    href: '/partners/oilfield',
  },
  {
    id: 'carriers',
    icon: '\ud83d\ude9b',
    headline: 'For Carriers and Logistics Companies',
    body: 'Post once, fill fast. Your dispatchers stop making calls. Operators get matched by corridor, equipment, and certification level. Standing Orders handle recurring routes automatically. Escrow handles payment.',
    cta: 'See Broker Features',
    href: '/loads',
  },
  {
    id: 'wind',
    icon: '\ud83c\udf2c\ufe0f',
    headline: 'For Wind Energy Projects',
    body: 'Blade transport requiring 5-vehicle escort convoys, multi-state coordination, and county road navigation is our specialty. Our wind energy corridor network spans the US Midwest, European offshore corridors, and Australian renewable zones.',
    cta: 'Wind Energy Network',
    href: '/partners/wind-energy',
  },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your Operations Deserve a{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
              Smarter Escort System
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Whether you\u2019re running autonomous freight corridors, oilfield equipment moves, or wind farm construction \u2014
            Haul Command gives your operations team verified, insured, certified escorts. Dispatched in minutes.
            Paid through escrow. No calls. No paperwork.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
            >
              See How It Works
            </a>
            <a
              href="#inquiry"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Talk to Someone
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">The current process is broken</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROBLEMS.map((problem) => (
            <div key={problem} className="flex items-start gap-3 p-5 bg-red-500/5 border border-red-500/10 rounded-xl">
              <span className="text-red-400 mt-0.5 text-lg">\u2717</span>
              <p className="text-gray-300">{problem}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solution */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">One platform. Every corridor. 57 countries.</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOLUTIONS.map((s) => (
            <div key={s.text} className="flex items-start gap-3 p-5 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-gray-300 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-10 text-center">Built for your operation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {USE_CASES.map((uc) => (
            <div key={uc.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all">
              <span className="text-3xl block mb-3">{uc.icon}</span>
              <h3 className="text-xl font-bold mb-2">{uc.headline}</h3>
              <p className="text-gray-400 text-sm mb-4">{uc.body}</p>
              <Link
                href={uc.href}
                className="text-amber-400 text-sm font-medium hover:text-amber-300 transition-colors"
              >
                {uc.cta} \u2192
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '7,745+', label: 'Operators tracked' },
            { val: '57', label: 'Countries' },
            { val: '219+', label: 'Corridors' },
            { val: '47 min', label: 'Median fill time' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-amber-400">{s.val}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry" className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your operations</h2>
        <p className="text-gray-400 text-center mb-8">
          No sales calls. No demos unless you want one.
          Tell us what you need and we\u2019ll show you how it works.
        </p>
        <PartnerInquiryForm />
      </section>
    </div>
  );
}
