import React from 'react';
import Link from 'next/link';

export function HCHeaderActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return (
      <Link 
        href="/dashboard"
        className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-slate-800 text-white hover:bg-slate-700 transition-colors"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-3">
      <Link 
        href="/sign-in"
        className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
      >
        Sign In
      </Link>
      <Link 
        href="/claim"
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md bg-hc-gold-500 text-slate-950 hover:bg-hc-gold-400 transition-colors"
      >
        Claim Profile
      </Link>
    </div>
  );
}
