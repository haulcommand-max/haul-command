import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — Haul Command | Plans for Operators & Brokers',
  description: 'Choose your plan on Haul Command. Free directory listing for operators, Pro for priority ranking, and Broker seats for unlimited load posting. Escrow-protected payments across 120 countries.',
};

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    period: '',
    description: 'Get listed and start receiving loads',
    highlight: false,
    features: [
      'Directory listing',
      'Load board access',
      'Up to 5 job responses/month',
      'Standard support',
      'Basic corridor visibility',
      'Escrow-protected payments',
    ],
    cta: 'Start Free',
    href: '/auth/register?plan=basic',
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'Priority ranking & unlimited opportunities',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Priority corridor ranking',
      'Unlimited job responses',
      'Read receipts in messaging',
      'Verified badge \u2713',
      'Early load alerts (before non-Pro)',
      'Analytics dashboard',
      'Response time tracking',
      'Profile boost (1x/month)',
    ],
    cta: 'Start Pro',
    href: '/auth/register?plan=pro',
  },
  {
    name: 'Elite',
    price: '$149',
    period: '/month',
    description: 'Top placement + dedicated support',
    highlight: false,
    features: [
      'Everything in Pro',
      'Top 3 guaranteed placement per corridor',
      'Emergency fill priority',
      'White-glove onboarding',
      'Dedicated account manager',
      'Custom corridor analytics',
      'Priority escrow processing',
      'Insurance verification badge',
    ],
    cta: 'Start Elite',
    href: '/auth/register?plan=elite',
  },
  {
    name: 'Broker',
    price: '$99',
    period: '/seat/month',
    description: 'Unlimited loads + corridor intelligence',
    highlight: false,
    features: [
      'Post unlimited loads',
      'Stage probability scoring',
      'Hard-fill alert system',
      'Corridor sponsor slot',
      'Standing Orders (recurring)',
      'Escrow dashboard',
      'Operator rankings view',
      'Response analytics',
    ],
    cta: 'Start Broker',
    href: '/auth/register?plan=broker',
  },
];

const ADD_ONS = [
  { name: 'Load Boost', desc: 'Push one load to the top of the board for 24 hours', price: '$15/boost' },
  { name: 'Corridor Sponsor', desc: 'Featured placement on a corridor page', price: '$99/month' },
  { name: 'Directory Featured', desc: 'Top of directory results in your region', price: '$49/month' },
  { name: 'Emergency Fill Blast', desc: 'Broadcast to all available operators in a corridor instantly', price: '$25/blast' },
];

const FAQ = [
  { q: 'Can I start for free?', a: 'Yes. The Basic plan is completely free. You get a directory listing, load board access, and up to 5 job responses per month. No credit card required.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, debit cards, and bank transfers through Stripe. For enterprise plans, we also support invoicing.' },
  { q: 'How does escrow work?', a: 'When a broker accepts an operator for a load, the payment is held in escrow by Stripe. Once the job is confirmed complete, funds are released to the operator. Haul Command takes a 5% platform fee.' },
  { q: 'Can I upgrade or downgrade at any time?', a: 'Yes. You can change your plan at any time. Upgrades are prorated, and downgrades take effect at the end of your billing cycle.' },
  { q: 'What is a corridor?', a: 'A corridor is a common transport route between two locations. For example, I-10 Houston to Beaumont or the M1 London to Leeds.' },
  { q: 'Do you operate internationally?', a: 'Yes! Haul Command operates across 120 countries worldwide including the US, Canada, Australia, UK, Germany, UAE, Brazil, and more.' },
  { q: 'What is Standing Orders?', a: 'Standing Orders allow brokers to automatically book recurring escort services on the same corridor. The system auto-creates escrow, auto-dispatches to matched operators, and auto-captures the fee.' },
  { q: 'How does the Verified badge work?', a: 'Pro operators receive a verified badge after confirming their phone number and identity. Elite operators get an enhanced badge after additional background and insurance verification.' },
  { q: 'What is Emergency Fill Blast?', a: 'When you urgently need an escort, Emergency Fill Blast sends your load to ALL available operators on the corridor simultaneously. First to accept wins the job.' },
  { q: 'How do I cancel?', a: 'You can cancel your subscription at any time from your account settings. You\'ll retain access until the end of your billing period.' },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Pricing That Scales With You
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Start free. Upgrade when the loads start flowing. Every plan includes escrow protection.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl border transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
              </div>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400 mt-0.5">\u2713</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                  plan.highlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-500">
          <span className="flex items-center gap-1">\ud83d\udd12 Escrow Protected</span>
          <span className="flex items-center gap-1">\u2713 Verified Operators</span>
          <span className="flex items-center gap-1">\ud83c\udf0d 120 countries</span>
          <span className="flex items-center gap-1">\ud83d\udcb3 No card required to start</span>
        </div>
      </section>

      {/* Add-ons */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Add-Ons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADD_ONS.map((addon) => (
            <div key={addon.name} className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white">{addon.name}</h3>
                  <p className="text-sm text-gray-400">{addon.desc}</p>
                </div>
                <span className="text-amber-400 font-bold text-sm whitespace-nowrap">{addon.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ.map((faq, i) => (
            <details key={i} className="group p-5 bg-white/5 border border-white/10 rounded-xl">
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-gray-500 group-open:rotate-180 transition-transform">\u25BC</span>
              </summary>
              <p className="mt-3 text-sm text-gray-400">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-gray-400 mb-8">Join 1.5M+ operators across 120 countries.</p>
        <Link
          href="/auth/register"
          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-colors"
        >
          Start Free Today
        </Link>
      </section>
    </div>
  );
}
