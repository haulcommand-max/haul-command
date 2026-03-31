'use client';

/**
 * Post-claim onboarding step: Connect ELD for verified availability.
 */
export function MotiveOnboardingStep() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/30 border border-gray-700/50 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>

      <h3 className="text-white text-xl font-bold mb-2">Connect Your ELD</h3>
      <p className="text-gray-400 text-sm mb-2">for verified availability data</p>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6">
        <p className="text-amber-400 text-sm font-semibold">
          📈 Operators with ELD verification get 3× more load offers
        </p>
      </div>

      <div className="space-y-3 text-left text-sm text-gray-400 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span>Real-time location appears on broker maps</span>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span>HOS automatically verified — no manual updates needed</span>
        </div>
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          <span>"ELD Verified" badge on your directory profile</span>
        </div>
      </div>

      <a href="/api/motive/connect" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/25">
        Connect Motive ELD
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </a>

      <button aria-label="Interactive Button" className="block mx-auto mt-4 text-gray-500 text-xs hover:text-gray-400 transition-colors">
        Skip for now
      </button>
    </div>
  );
}
