'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function MotiveConnectContent() {
  const params = useSearchParams();
  const status = params.get('status');
  const company = params.get('company');
  const fleetSize = params.get('fleet_size');
  const errorMsg = params.get('message');

  if (status === 'success') {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">You&apos;re HC Verified!</h1>
        <p className="text-gray-400 mb-6">
          Your ELD has been connected successfully.
          {company && <> <strong className="text-white">{company}</strong></>}
          {fleetSize && fleetSize !== '0' && <> — {fleetSize} vehicle{Number(fleetSize) !== 1 ? 's' : ''} tracked</>}
        </p>
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-400">
            ✓ Safety badge added to your listing<br />
            ✓ Priority run matching enabled<br />
            ✓ Live position tracking active<br />
            ✓ Leaderboard eligible
          </div>
        </div>
        <Link
          href="/directory"
          className="inline-flex mt-8 bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
        >
          View Your Listing →
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-20 max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Connection Failed</h1>
        <p className="text-gray-400 mb-6">
          {errorMsg || 'Hit a snag connecting your ELD. Try again or contact support.'}
        </p>
        <Link
          href="/claim"
          className="inline-flex bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
        >
          Try Again →
        </Link>
      </div>
    );
  }

  // Default — pre-connect landing
  return (
    <div className="max-w-2xl mx-auto py-16">
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-blue-400 text-xs font-semibold">HC Verification</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-4">
          Get <span className="text-blue-400">HC Verified</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Connect your ELD to verify your fleet and unlock premium benefits on Haul Command.
        </p>
      </header>

      <div className="space-y-4 mb-10">
        {[
          { icon: '🛡️', title: 'Verified Safety Badge', desc: 'Display a trust badge on your listing backed by real ELD data' },
          { icon: '🏆', title: 'Safety Leaderboard', desc: 'Rank on the leaderboard by your composite safety score' },
          { icon: '📦', title: 'Priority Run Matching', desc: 'Verified pilots get matched to runs before unverified ones' },
          { icon: '📍', title: 'Live Position Tracking', desc: 'Brokers can see your real-time location for faster dispatch' },
        ].map((benefit) => (
          <div key={benefit.title} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 flex items-start gap-4">
            <span className="text-2xl">{benefit.icon}</span>
            <div>
              <h3 className="text-white font-bold text-sm">{benefit.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-xs mb-6">
          We&apos;ll redirect you to Motive to authorize read-only access to your fleet data.
          No data is shared publicly without your consent.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="text-gray-600 text-[11px]">
            Supported ELD: <strong className="text-gray-400">Motive</strong> · 
            <span className="italic ml-1">Samsara, Geotab coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MotiveConnectPage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4">
        <Suspense fallback={<div className="text-center py-20 text-gray-500">Loading...</div>}>
          <MotiveConnectContent />
        </Suspense>
      </main>
    </>
  );
}
