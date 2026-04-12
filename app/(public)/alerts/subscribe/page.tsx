import React from 'react';
import EmailCaptureWidget from '@/components/monetization/EmailCaptureWidget';

export const metadata = {
  title: 'Heavy Haul Alerts & Corridor Intel | Haul Command',
  description: 'Subscribe to critical oversize load regulation changes, live corridor conditions, and pilot car alerts sent directly to your inbox.',
};

export default function AlertsSubscribePage() {
  return (
    <div className=" bg-hc-bg text-hc-text font-display flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid & Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(198,146,58,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(198,146,58,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-hc-gold-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-12 py-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-hc-gold-500/10 border border-hc-gold-500/20 rounded-full text-xs font-bold text-hc-gold-500 uppercase tracking-widest mx-auto">
            <span className="w-2 h-2 rounded-full bg-hc-gold-500 animate-pulse" /> Live Intel
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[-0.03em] leading-tight">
            Knowledge is Weight.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-gold-500 to-amber-600">
              Never Miss A Regulation Change.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-hc-muted max-w-xl mx-auto leading-relaxed">
            Get instant notifications when state DOTs update curfew times, bridge formulas, or escort requirements for the routes you run.
          </p>
        </div>

        <div className="bg-hc-surface/80 backdrop-blur-xl border border-hc-border rounded-3xl p-1 shadow-2xl">
          <div className="bg-hc-bg border border-hc-border-high rounded-3xl p-8 md:p-12">
            <EmailCaptureWidget 
              headline="Get Real-Time Intelligence"
              subheadline="Join 12,000+ operators who stay ahead of DOT sweeps and regulation updates."
              context="tool" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12 border-t border-hc-border/50">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">State Requirements</h3>
            <p className="text-sm text-hc-subtle">Instant alerts when your saved states modify pilot car equipment rules or night travel hours.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Corridor Conditions</h3>
            <p className="text-sm text-hc-subtle">Get notified about active weigh station crackdowns, construction, or sudden bridge closures.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Zero Spam</h3>
            <p className="text-sm text-hc-subtle">We only send contextual, high-signal alerts about the specific regions you actually operate in.</p>
          </div>
        </div>
      </div>
    </div>
  );
}