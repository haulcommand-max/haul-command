'use client';

import React from 'react';

interface MotiveReferralCTAProps {
  variant?: 'banner' | 'inline' | 'card';
  className?: string;
}

const REFERRAL_URL = process.env.NEXT_PUBLIC_MOTIVE_REFERRAL_URL || 'https://gomotive.com/?ref=haulcommand';

/**
 * MotiveReferralCTA — referral revenue surface.
 * 
 * Positioned as "Get HC Verified" — not as a Motive ad.
 * Non-Motive operators see this as part of the verification flow.
 * The messaging frames it as upgrading to verified status,
 * with Motive as the technology provider.
 */
export default function MotiveReferralCTA({ variant = 'card', className = '' }: MotiveReferralCTAProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600/10 via-blue-500/5 to-transparent border border-blue-500/15 rounded-xl px-5 py-3 flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Get HC Verified — unlock priority loads</p>
            <p className="text-gray-500 text-[11px]">Connect your ELD to verify your fleet and earn trust badges</p>
          </div>
        </div>
        <a
          href={REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors flex-shrink-0"
        >
          Get Verified →
        </a>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <a
        href={REFERRAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors ${className}`}
      >
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Get HC Verified →
      </a>
    );
  }

  // Card variant (default)
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 hover:border-blue-500/20 transition-all ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Become HC Verified</h3>
          <p className="text-gray-500 text-[11px]">Stand out with a verified badge</p>
        </div>
      </div>
      <ul className="space-y-2 mb-5 text-xs text-gray-400">
        <li className="flex items-center gap-2">
          <span className="text-green-400">✓</span> Verified safety badge on your profile
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-400">✓</span> Priority placement in load matching
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-400">✓</span> Real-time fleet tracking for brokers
        </li>
        <li className="flex items-center gap-2">
          <span className="text-green-400">✓</span> Safety score on leaderboards
        </li>
      </ul>
      <div className="flex items-center gap-3">
        <a
          href={REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-blue-500 text-white text-center px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors"
        >
          Get Verified →
        </a>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-gray-600">
        <span>Verification via</span>
        <span className="font-semibold text-gray-500">Motive ELD</span>
        <span>·</span>
        <span>Also supports:</span>
        <span className="text-gray-500">Samsara</span>
        <span className="text-gray-600 italic">(coming soon)</span>
      </div>
    </div>
  );
}
