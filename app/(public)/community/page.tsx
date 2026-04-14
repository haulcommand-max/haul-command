import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Heavy Haul Operator Community | Haul Command',
  description: 'Join the verified network of North American heavy haul carriers and pilot car dispatchers. Share intel, source escorts, and build trust.',
};

export default function CommunityLandingPage() {
  return (
    <div className=" bg-hc-bg text-hc-text font-display flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Grid & Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(39,209,127,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(39,209,127,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-hc-success/5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-12 py-20 px-4 md:px-0">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-hc-success/10 border border-hc-success/20 rounded-full text-xs font-bold text-hc-success uppercase tracking-widest mx-auto">
            <span className="w-2 h-2 rounded-full bg-hc-success animate-pulse" /> Verified Network
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[-0.03em] leading-tight max-w-2xl mx-auto">
            Stop Guessing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-success to-emerald-600">
              Only Verified Operators Here.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-hc-muted max-w-2xl mx-auto leading-relaxed">
            Unregulated Facebook groups are full of ghost operators and unverified dispatchers. 
            Join the only heavy haul operator network where every pilot car, carrier, and broker is algorithmically verified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left py-8">
          <div className="bg-hc-surface/80 backdrop-blur-md border border-hc-border rounded-2xl p-8 hover:border-hc-success/40 transition-colors">
            <h3 className="text-2xl font-black text-white mb-2 uppercase">Claim Your Profile</h3>
            <p className="text-sm text-hc-subtle mb-6 leading-relaxed">
              We already aggregated the DOT and FMCSA data. Claim your business identity, verify your insurance, and get inbound load requests from high-paying brokers.
            </p>
            <Link aria-label="Navigation Link" href="/directory/claim" className="inline-flex px-6 py-3 bg-hc-elevated hover:bg-hc-surface border border-hc-border hover:border-hc-success text-white font-bold text-xs rounded-xl uppercase tracking-widest transition-all w-full justify-center">
              Claim Your Business
            </Link>
          </div>

          <div className="bg-hc-success/10 backdrop-blur-md border border-hc-success/30 rounded-2xl p-8 hover:border-hc-success/50 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <span className="font-serif text-8xl text-hc-success">"</span>
             </div>
            <h3 className="text-2xl font-black text-hc-success mb-2 uppercase">Connect With Group</h3>
            <p className="text-sm text-hc-subtle mb-6 leading-relaxed">
              Are you part of the official Heavy Haul Facebook community? Sync your account to inherit your group trust score and immediately bypass the manual verification queue.
            </p>
            <Link aria-label="Navigation Link" href="/api/auth/facebook" className="inline-flex px-6 py-3 bg-hc-success hover:bg-emerald-500 text-white font-bold text-xs rounded-xl uppercase tracking-widest transition-all w-full justify-center">
              Connect Facebook
            </Link>
          </div>
        </div>

        <div className="pt-12 border-t border-hc-border/50 max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                    <div className="text-3xl font-black text-white mb-1">12K+</div>
                    <div className="text-[10px] font-bold text-hc-muted uppercase tracking-wider">Directory Listings</div>
                </div>
                <div>
                    <div className="text-3xl font-black text-white mb-1">2,400+</div>
                    <div className="text-[10px] font-bold text-hc-muted uppercase tracking-wider">Claimed Profiles</div>
                </div>
                <div>
                    <div className="text-3xl font-black text-hc-success mb-1">98%</div>
                    <div className="text-[10px] font-bold text-hc-muted uppercase tracking-wider">Verification Rate</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}