import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Claim Your Listing — Free Verified Profile | Haul Command',
  description: 'Claim your operator listing on Haul Command. Get verified in minutes, start receiving load offers, and boost your corridor ranking. Free for all operators.',
};

const STEPS = [
  {
    step: 1,
    title: 'Find Your Listing',
    desc: 'Search our directory of 1.5M+ operator listings across 120 countries. Your company may already be listed.',
    icon: '\ud83d\udd0d',
  },
  {
    step: 2,
    title: 'Verify Your Identity',
    desc: 'Confirm your phone number, email, and company details. This takes less than 2 minutes.',
    icon: '\ud83d\udcf1',
  },
  {
    step: 3,
    title: 'Upload Documents',
    desc: 'Add your insurance certificate, business license, and any relevant certifications.',
    icon: '\ud83d\udcc4',
  },
  {
    step: 4,
    title: 'Set Your Corridors',
    desc: 'Choose the corridors you operate on. This determines where you appear in search and load matching.',
    icon: '\ud83d\udee3\ufe0f',
  },
  {
    step: 5,
    title: 'Set Availability',
    desc: 'Toggle your real-time availability so brokers know when you\'re ready for work.',
    icon: '\u2705',
  },
  {
    step: 6,
    title: 'Start Receiving Offers',
    desc: 'Your listing goes live immediately. Load offers arrive through the inbox with escrow protection.',
    icon: '\ud83d\udcb0',
  },
];

const BENEFITS = [
  { title: 'Free Verified Badge', desc: 'Verified operators get 3x more load offers than unverified listings.', icon: '\u2713' },
  { title: 'Corridor Rankings', desc: 'Appear in leaderboards and get priority in load matching on your corridors.', icon: '\ud83c\udfc6' },
  { title: 'Escrow Protection', desc: 'Every payment goes through escrow. Get paid when the job is done, guaranteed.', icon: '\ud83d\udd12' },
  { title: 'Real-Time Alerts', desc: 'Get instant notifications when new loads are posted on your corridors.', icon: '\ud83d\udd14' },
  { title: 'Analytics Dashboard', desc: 'Track your response time, acceptance rate, and earnings over time.', icon: '\ud83d\udcca' },
  { title: '57 Country Network', desc: 'Access the global heavy haul network spanning 120 countries and 219+ corridors.', icon: '\ud83c\udf0d' },
];

export default function ClaimPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Claim Your Free Listing
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Your company may already be in our directory. Claim it in under 5 minutes, get verified, and start receiving load offers with escrow-protected payments.
        </p>
        <Link aria-label="Navigation Link"
          href="/auth/register?intent=claim"
          className="inline-block px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-colors"
        >
          Find My Listing
        </Link>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-10 text-center">6 Steps to Get Verified</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 flex items-center justify-center bg-amber-500/20 text-amber-400 rounded-full text-sm font-bold">
                  {s.step}
                </span>
                <span className="text-2xl">{s.icon}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-10 text-center">Why Claim Your Listing?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-amber-400 text-xl font-bold">{b.icon}</span>
              <h3 className="font-bold mt-2">{b.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-amber-400">1.5M+</p>
            <p className="text-sm text-gray-500">Listings to claim</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">57</p>
            <p className="text-sm text-gray-500">Countries</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-amber-400">3x</p>
            <p className="text-sm text-gray-500">More offers when verified</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Don\u2019t Miss Out</h2>
        <p className="text-gray-400 mb-8">
          Operators who claim their listing in the first 30 days get priority corridor placement for free.
        </p>
        <Link aria-label="Navigation Link"
          href="/auth/register?intent=claim"
          className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg rounded-xl transition-colors"
        >
          Claim Now \u2014 It\u2019s Free
        </Link>
      </section>
    </div>
  );
}
