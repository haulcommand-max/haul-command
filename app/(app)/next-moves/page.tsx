import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldCheck, MapPin, Target, Wallet, AlertTriangle, ArrowRight, Activity, Smartphone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: "Next Moves | Haul Command App",
  description: "Your personalized operational hub.",
};

export default async function NextMovesPage() {
  const supabase = createServerComponentClient({ cookies });
  
  // 1. Fetch User Identity & Role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, claim_status, trust_score, verified, market_locale')
    .eq('id', user.id)
    .single();

  // 2. Intent Engine Math (Mock implementation over real schema)
  // In production, calculating 'next_best_action' uses the Rule 6 aggregator.
  const isOperator = profile?.role === 'operator' || profile?.role === 'pilot_car';
  const isBroker = profile?.role === 'broker';

  // 3. Fallback routing if role is missing
  if (!profile?.role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 space-y-6 text-center animate-in fade-in duration-700">
        <Target className="h-16 w-16 text-amber-500" />
        <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-tight">Identify Your Position</h1>
        <p className="text-slate-400 max-w-sm">We need to lock your operational role before computing your next moves.</p>
        <Link href="/onboarding/role" className="w-full max-w-xs py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-widest rounded-lg flex justify-center items-center gap-2">
          Set My Role <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="  text-slate-100 pb-20">
      {/* Top Warning Banner if tracking is disabled */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center gap-3">
        <Smartphone className="h-5 w-5 text-amber-500 animate-pulse" />
        <p className="text-xs font-semibold text-amber-500/90 leading-tight">
          GPS Telemetry Offline. Toggle "Available Now" to broadcast position to brokers.
        </p>
      </div>

      <header className="px-4 py-8 max-w-lg mx-auto">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Next Moves</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2  border border-slate-800 rounded-full px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-500 tracking-widest">{profile.market_locale || 'GLOBAL'}</span>
          </div>
          {profile.verified ? (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED
            </div>
          ) : (
             <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 tracking-wider">
              <AlertTriangle className="h-3 w-3" /> PENDING VERIFICATION
            </div>
          )}
        </div>
      </header>

      <main className="px-4 space-y-4 max-w-lg mx-auto">
        
        {/* Dynamic Action 1: The Urgent Core Action */}
        {isOperator && profile.claim_status !== 'claimed' && (
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-amber-500/10 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <span className="uppercase text-[10px] font-black tracking-widest text-amber-500 mb-2 block">Priority 1</span>
              <h2 className="text-xl font-bold text-white mb-2 leading-tight">Claim Your Profile</h2>
              <p className="text-sm text-slate-300 mb-6">Brokers are filtering out unclaimed operators. Claim now to appear on the Houston Local Board.</p>
              <Link href="/claim" className="inline-flex w-full py-3 bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-sm justify-center items-center gap-2 rounded-lg">
                Start Claim <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Dynamic Action 2: Operational Match */}
        {isOperator && (
          <div className=" border border-slate-800 rounded-2xl p-5">
             <span className="uppercase text-[10px] font-black tracking-widest text-blue-500 mb-2 block">Urgent Load Matches</span>
             <h2 className="text-lg font-bold text-white mb-1">3 Loads Posted Near You</h2>
             <p className="text-sm text-slate-400 mb-4">Surge pricing active. Only 1 other operator is online within 50 miles.</p>
             <button className="w-full py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 font-bold uppercase tracking-wider text-sm rounded-lg border border-blue-500/30 transition-colors">
               View Live Loads
             </button>
          </div>
        )}

        {/* Dynamic Action 2 (Broker): Load Status */}
        {isBroker && (
          <div className=" border border-slate-800 rounded-2xl p-5">
             <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="uppercase text-[10px] font-black tracking-widest text-emerald-500 mb-2 block">Live Escrow</span>
                  <h2 className="text-lg font-bold text-white mb-1">Active: TX-9001</h2>
                  <p className="text-sm text-slate-400">Escort en-route to pickup.</p>
               </div>
               <Activity className="h-6 w-6 text-emerald-500 animate-pulse" />
             </div>
             <Link href="/app/escrow/TX-9001" className="w-full flex py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-sm justify-center items-center rounded-lg transition-colors">
               Open Command Board
             </Link>
          </div>
        )}

        {/* Dynamic Action 3: Moat & Trust Expansion */}
        <div className=" border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1">
              <span className="uppercase text-[10px] font-black tracking-widest text-slate-400 mb-1 block">Trust & Proof</span>
              <h3 className="text-sm font-bold text-white mb-1">Upload Current Insurance</h3>
              <p className="text-xs text-slate-400">Your $1M Liability OCR check is incomplete. Fast-track your badge.</p>
            </div>
            <Link href="/app/compliance" className="w-full sm:w-auto px-6 py-2 border border-slate-700 text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-lg text-center hover:bg-slate-800">
               Upload Docs
            </Link>
        </div>

      </main>
    </div>
  );
}