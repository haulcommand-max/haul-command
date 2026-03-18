import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import HCFaqModule from '@/components/hc/FaqModule';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

export const metadata: Metadata = {
  title: 'Claim Your Business Listing — Haul Command',
  description:
    'Claim and verify your escort, pilot car, or heavy haul business listing on Haul Command. Free to claim. Unlock premium features, respond to loads, and build your verified reputation.',
};

export default function ClaimPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Claim Listing</span>
        </nav>

        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Claim Your <span className="text-accent">Listing</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Take ownership of your business profile on the world&apos;s largest pilot car and escort vehicle directory.
            Claiming is free. Verification unlocks premium features.
          </p>
        </header>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { step: '1', icon: '🔍', title: 'Find Your Listing', desc: 'Search for your business in our directory. If we don\'t have it yet, you can add it.' },
            { step: '2', icon: '📱', title: 'Verify by Phone', desc: 'We\'ll send a verification code to your business phone number.' },
            { step: '3', icon: '✅', title: 'You\'re In Control', desc: 'Update your profile, set availability, respond to loads, and unlock premium placement.' },
          ].map((s) => (
            <div key={s.step} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 text-center">
              <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 text-accent font-black text-sm">
                {s.step}
              </div>
              <div className="text-2xl mb-2">{s.icon}</div>
              <h2 className="text-white font-bold text-base mb-1.5">{s.title}</h2>
              <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Search/Start */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-white font-bold text-xl mb-3">Start Your Claim</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Enter your business name or phone number to find your listing.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="text"
              placeholder="Business name or phone number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <button className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap">
              Find Listing
            </button>
          </div>
          <p className="text-gray-600 text-[10px] mt-3">
            Can&apos;t find your business? <Link href="/report-data-issue" className="text-accent hover:underline">Add a new listing →</Link>
          </p>
        </div>

        {/* Benefits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">What You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '✅', title: 'Verified Badge', desc: 'Stand out with a verified badge visible on search and profile' },
              { icon: '📞', title: 'Direct Contact', desc: 'Receive calls and texts directly from shippers and carriers' },
              { icon: '📊', title: 'Profile Analytics', desc: 'See how many times your profile is viewed and contacted' },
              { icon: '🚀', title: 'Priority Placement', desc: 'Verified profiles appear higher in search results' },
              { icon: '📦', title: 'Load Alerts', desc: 'Get notified when matching loads are posted in your area' },
              { icon: '🛡️', title: 'Reputation System', desc: 'Build your trust score through verified performance data' },
            ].map((b, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 flex gap-4 items-start">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <h3 className="text-white font-bold text-sm">{b.title}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <HCFaqModule
          items={[
            { question: 'Is claiming free?', answer: 'Yes, claiming your listing is completely free. Premium features like boost credits and enhanced analytics are available through paid plans, but the core claim and verification is always free.' },
            { question: 'How long does verification take?', answer: 'Phone verification is instant — you\'ll receive a code via call or SMS. Document verification (for enhanced trust badges) typically takes 1-2 business days.' },
            { question: 'What if my business isn\'t listed yet?', answer: 'You can add your business directly through the claim flow. We\'ll create your profile and you can claim it immediately.' },
            { question: 'Can I remove my listing?', answer: 'Yes. You can request listing removal at any time through our Remove Listing page. We comply with all applicable privacy regulations.' },
          ]}
        />

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
