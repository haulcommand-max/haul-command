'use client';

import React from 'react';

interface MotiveConnectButtonProps {
  providerId: string;
  connected?: boolean;
  companyName?: string;
  className?: string;
}

/**
 * MotiveConnectButton — "Connect Your ELD" CTA.
 * If already connected, shows status. Otherwise links to the OAuth flow.
 */
export default function MotiveConnectButton({
  providerId,
  connected = false,
  companyName,
  className = '',
}: MotiveConnectButtonProps) {
  if (connected) {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 ${className}`}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-green-400 text-sm font-semibold">ELD Connected</span>
        {companyName && <span className="text-green-400/60 text-xs">({companyName})</span>}
      </div>
    );
  }

  return (
    <a
      href={`/api/motive/connect?provider_id=${encodeURIComponent(providerId)}`}
      className={`group inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] hover:border-accent/30 rounded-xl px-5 py-3 transition-all hover:bg-accent/[0.04] ${className}`}
    >
      {/* Motive-style icon */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM4 11a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM6 14a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
        </svg>
      </div>
      <div className="text-left">
        <div className="text-white text-sm font-bold group-hover:text-accent transition-colors">
          Connect Your ELD
        </div>
        <div className="text-gray-500 text-[11px]">
          Verify via Motive — unlock safety badge & load priority
        </div>
      </div>
      <svg className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
