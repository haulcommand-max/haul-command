'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center min-h-screen flex flex-col items-center justify-center">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-red-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative">
        <span className="text-5xl mb-6 block">⚠️</span>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tighter">
          Something Went Wrong
        </h1>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto leading-relaxed">
          We hit an unexpected error. Our team has been notified and is working on a fix.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-white/5 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/10 border border-white/10 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {error.digest && (
          <p className="text-gray-700 text-[10px] mt-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
