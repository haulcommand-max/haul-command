import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCFaqModule from '@/components/hc/FaqModule';
import HCClaimCorrectVerifyPanel from '@/components/hc/ClaimCorrectVerifyPanel';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';

export const metadata: Metadata = {
  title: 'Heavy Haul Load Board — Post & Find Oversize Loads',
  description:
    'Post oversize loads for escort coverage or find loads in your area. Connect with verified pilot car operators and escort services across 57 countries.',
};

export default function LoadsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Load Board</span>
        </nav>

        <HCMarketMaturityBanner
          state="planned"
          countryName="Load Board"
          message="The Haul Command load board is launching soon. Sign up for alerts below."
        />

        <header className="mt-8 mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Heavy Haul <span className="text-accent">Load Board</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Post oversize and heavy haul loads for escort coverage, or find available loads in your service area. 
            When live, the load board connects shippers and brokers with verified escort operators.
          </p>
        </header>

        {/* Two-Path Launcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-white font-bold text-xl mb-2">I Need Escort Coverage</h2>
            <p className="text-gray-400 text-sm mb-4">
              Post your oversize load details and get connected with verified escort operators near your route.
            </p>
            <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-accent text-sm font-bold">
              Coming Soon — Join Waitlist ↓
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-white font-bold text-xl mb-2">I Want Loads in My Area</h2>
            <p className="text-gray-400 text-sm mb-4">
              Browse available loads that need escort coverage. Filter by location, dimensions, and time.
            </p>
            <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-accent text-sm font-bold">
              Coming Soon — Join Waitlist ↓
            </div>
          </div>
        </div>

        {/* Alert Capture */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 mb-12 text-center">
          <h2 className="text-white font-bold text-2xl mb-3">Get Load Board Alerts</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Be the first to know when loads are posted in your area. Set up alerts by state, corridor, or service type.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <button className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap">
              Join Waitlist
            </button>
          </div>
        </div>

        {/* In the meantime — directory and requirements */}
        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-white">While You Wait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/directory"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">🔍</span>
              <h3 className="text-white font-bold text-sm mt-2">Browse Directory</h3>
              <p className="text-gray-500 text-xs mt-1">Find escort operators by country and category</p>
            </Link>
            <Link
              href="/escort-requirements"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">📋</span>
              <h3 className="text-white font-bold text-sm mt-2">Check Requirements</h3>
              <p className="text-gray-500 text-xs mt-1">Escort rules for 67+ jurisdictions</p>
            </Link>
            <Link
              href="/claim"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">✅</span>
              <h3 className="text-white font-bold text-sm mt-2">Claim Your Listing</h3>
              <p className="text-gray-500 text-xs mt-1">Get found by shippers and brokers</p>
            </Link>
          </div>
        </div>

        <HCClaimCorrectVerifyPanel
          claimAction={{ id: 'claim', label: 'Claim Your Listing', href: '/claim', type: 'claim', priority: 'primary' }}
          contextCopy="List your escort service to receive loads when the board goes live."
        />

        <HCFaqModule
          items={[
            { question: 'When will the load board launch?', answer: 'The Haul Command load board is in development. Join our waitlist to be notified when it goes live. In the meantime, you can browse the directory and claim your listing to be ready.' },
            { question: 'How does posting a load work?', answer: 'When live, you\'ll enter load dimensions, route, and timing. We\'ll match you with verified escort operators who cover your corridor and meet the regulatory requirements for your route.' },
            { question: 'How do escort operators find loads?', answer: 'Operators set their service area, capabilities, and availability. When a load matches their profile, they receive an alert with full details and can respond instantly.' },
          ]}
        />

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
