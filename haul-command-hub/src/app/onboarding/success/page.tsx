'use client';

import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams?.get('plan') ?? 'free';
  const isPro = plan === 'pro' || plan === 'verified';

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 py-12 sm:py-20 overflow-x-hidden text-center">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-10">
          {['Claim', 'Start', 'Territory', 'Plan', 'Success'].map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                ✓
              </span>
              <span className={i === 4 ? 'text-accent font-semibold' : 'text-gray-500'}>{step}</span>
              {i < 4 && <span className="text-gray-700 mx-1">→</span>}
            </span>
          ))}
        </div>

        {/* Success Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isPro
            ? 'bg-gradient-to-br from-accent/30 to-accent/5 border-2 border-accent/40 shadow-[0_0_30px_rgba(245,159,10,0.2)]'
            : 'bg-green-500/10 border-2 border-green-500/30'
        }`}>
          <span className="text-4xl">{isPro ? '🏆' : '✅'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter mb-3">
          {isPro ? (
            <>Your <span className="text-accent">Pro</span> Profile is Live</>
          ) : (
            <>Your Profile is <span className="text-green-400">Live</span></>
          )}
        </h1>

        {isPro ? (
          <>
            <p className="text-gray-400 text-base mb-6 max-w-lg mx-auto">
              Welcome to Haul Command Pro. Your verified badge is active, priority load alerts are enabled,
              and you&apos;re now visible to brokers searching your corridors.
            </p>
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-8">
              <span className="text-accent text-sm">⭐</span>
              <span className="text-accent text-sm font-semibold">Gold Verified Badge Active</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-base mb-4 max-w-lg mx-auto">
              Your profile is live in the directory. Brokers and shippers can find and contact you now.
            </p>
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 mb-8 max-w-md mx-auto">
              <p className="text-accent text-sm font-semibold mb-2">Upgrade to Pro to get:</p>
              <ul className="text-gray-400 text-xs space-y-1.5 text-left">
                <li>✦ Priority load alerts in your corridors</li>
                <li>✦ Verified badge &amp; higher search rank</li>
                <li>✦ Escrow-protected payments</li>
                <li>✦ Profile boost credits</li>
              </ul>
              <Link
                href="/pricing"
                className="block mt-4 bg-accent text-black py-2 rounded-lg font-bold text-sm hover:bg-yellow-500 transition-colors"
              >
                Upgrade to Pro →
              </Link>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/directory"
            className="bg-white/[0.06] text-white border border-white/[0.1] px-6 py-2.5 rounded-xl text-sm font-medium hover:border-accent/30 transition-all"
          >
            View Directory
          </Link>
          <Link
            href="/loads"
            className="text-gray-400 hover:text-accent px-4 py-2 text-sm transition-colors"
          >
            Browse Loads →
          </Link>
        </div>
      </main>
    </>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-accent animate-pulse">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
