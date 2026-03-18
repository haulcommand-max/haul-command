'use client';
import { useState } from 'react';
import type { AdCreative } from '@/lib/ad-engine';

interface AlertGateOfferProps {
  creatives: AdCreative[];
  context: string;
  /** Shown after user completes an alert signup or claim */
  triggerType: 'alert_signup' | 'claim_complete';
}

/**
 * AlertGateOffer — monetization surface at alert signup or claim completion.
 * Max 1 per page. Shows upgrade/premium offer after user takes an action.
 */
export function AlertGateOffer({ creatives, context, triggerType }: AlertGateOfferProps) {
  const [dismissed, setDismissed] = useState(false);

  if (creatives.length === 0 || dismissed) return null;
  const c = creatives[0];

  return (
    <div data-sponsor data-slot="alert_gate_offer" className="sponsor-slot bg-gradient-to-r from-accent/[0.06] to-blue-500/[0.04] border border-accent/15 rounded-2xl p-6 mb-8 relative">
      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-600 hover:text-white text-sm transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider border border-white/10 rounded px-1.5 py-0.5">
          {c.sponsor_label}
        </span>
        <span className="text-[10px] text-gray-500">
          {triggerType === 'alert_signup' ? 'Upgrade your alerts' : 'Unlock premium features'}
        </span>
      </div>

      {/* Offer */}
      <div className="flex items-start gap-4">
        {c.logo_url && <img src={c.logo_url} alt="" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{c.headline}</h3>
          {c.subhead && <p className="text-sm text-gray-400 mb-4">{c.subhead}</p>}
          <div className="flex flex-wrap gap-2">
            <a href={c.cta_url} className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors">
              {c.cta_label} →
            </a>
            <button onClick={() => setDismissed(true)} className="text-gray-500 text-sm hover:text-white transition-colors px-3">
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
