'use client';

import { useEffect, useState } from 'react';
import { Lock, TrendingUp, AlertCircle, ChevronRight, Zap, Banknote, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { QuickPayDashboardCard } from '@/components/quickpay/QuickPayWidget';

type ConnectStatus = {
  connected: boolean;
  onboarded: boolean;
  payouts_enabled: boolean;
  listing_claimed?: boolean;
  lifetime_earned_cents?: number;
  month_earned_cents?: number;
  missed_money_cents?: number;
  roi_multiple?: number;
  balance?: { available_cents: number; pending_cents: number };
};

type Payout = {
  id: string;
  amount: number;
  fee: number;
  net_amount: number;
  payout_method: string;
  status: string;
  created_at: string;
  paid_at?: string;
};

// Mock data for run cards
const MOCK_RUNS = [
  { id: '1', origin: 'Dallas, TX', dest: 'Houston, TX', rate: 450, status: 'pending_offer', time: '2h ago' },
  { id: '2', origin: 'Austin, TX', dest: 'San Antonio, TX', rate: 320, status: 'pending_offer', time: '5h ago' }
];

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100);

export default function EarningsDashboardPage() {
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // We add a demo toggle so the user can see both states easily
  const [demoClaimed, setDemoClaimed] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, payoutsRes] = await Promise.all([
          fetch('/api/connect/status'),
          fetch('/api/connect/payouts'),
        ]);
        
        let statusData: ConnectStatus = { connected: false, onboarded: false, payouts_enabled: false };
        if (statusRes.ok) statusData = await statusRes.json();
        
        // Mock the new fields if API doesn't have them yet
        setConnect({
          ...statusData,
          listing_claimed: demoClaimed,
          lifetime_earned_cents: 2845000, // $28,450
          month_earned_cents: 324000,     // $3,240
          missed_money_cents: 140000,     // $1,400
          roi_multiple: 27,
          balance: statusData.balance || { available_cents: 125000, pending_cents: 45000 }
        });

        if (payoutsRes.ok) setPayouts(await payoutsRes.json());
      } catch (e) {
        console.error("Failed to load earnings data");
      }
      setLoading(false);
    }
    load();
  }, [demoClaimed]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-var-m-bg flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-2 border-hc-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const isClaimed = connect?.listing_claimed;
  const lifetime = connect?.lifetime_earned_cents || 0;
  const monthly = connect?.month_earned_cents || 0;
  const missed = connect?.missed_money_cents || 0;
  const availableDollars = (connect?.balance?.available_cents || 0) / 100;

  return (
    <div className="min-h-[100dvh] bg-[#0B0B0C] text-white font-sans pb-24">
      {/* Dev Toggle */}
      <div className="bg-hc-danger/10 p-2 text-center text-xs flex justify-center gap-4 border-b border-hc-danger/20">
        <span className="text-hc-danger font-bold uppercase tracking-widest">DEV MODE</span>
        <button onClick={() => setDemoClaimed(!demoClaimed)} className="underline text-hc-danger">
          Toggle Claimed State: {isClaimed ? 'CLAIMED' : 'UNCLAIMED'}
        </button>
      </div>

      {/* QuickPay Dashboard Card â€” above hero metrics */}
      {isClaimed && availableDollars > 0 && (
        <div className="px-4 pt-4">
          <QuickPayDashboardCard
            eligibleCount={MOCK_RUNS.length}
            totalEligibleAmount={MOCK_RUNS.reduce((sum, r) => sum + r.rate, 0)}
          />
        </div>
      )}

      {/* Hero Metric Section */}
      <div className="pt-8 pb-6 px-4 border-b border-white/5 bg-gradient-to-b from-hc-gold/5 to-transparent relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none mix-blend-overlay" />
        
        <h1 className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold mb-2 text-center relative z-10">
          Lifetime Earned with Haul Command
        </h1>
        
        <div className="text-center relative z-10">
          {isClaimed ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-5xl font-black text-white tracking-tight tabular-nums flex items-center justify-center gap-1">
                <span className="text-hc-gold text-4xl">$</span>
                {(lifetime / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hc-success/10 border border-hc-success/20">
                <TrendingUp className="w-3.5 h-3.5 text-hc-success" />
                <span className="text-xs font-bold text-hc-success tracking-wide uppercase">
                  Paid for itself {connect?.roi_multiple}x
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-center">
              {/* Teaser Value */}
              <div className="text-5xl font-black text-white/20 tracking-tight tabular-nums relative inline-block blur-[4px] select-none">
                $28,540
                <div className="absolute inset-0 flex items-center justify-center blur-none z-20">
                  <div className="bg-[#121214] border border-white/10 p-3 rounded-full shadow-2xl">
                    <Lock className="w-6 h-6 text-hc-gold" />
                  </div>
                </div>
              </div>
              <div className="mt-6 max-w-xs mx-auto">
                <p className="text-sm font-medium text-white/80 leading-relaxed mb-4">
                  Claim your listing to track your lifetime earnings, payouts, and incoming run offers.
                </p>
                <Link href="/claim" className="w-full flex items-center justify-center gap-2 bg-hc-gold text-white font-bold text-sm tracking-wide uppercase py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(212,168,68,0.2)]">
                  <ShieldCheck className="w-4 h-4" />
                  Claim My Listing
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        
        {/* Value Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-hc-gold/5 rounded-bl-full pointer-events-none" />
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">This Month</span>
            <span className="text-2xl font-black text-white tabular-nums">{isClaimed ? fmt(monthly) : '---'}</span>
          </div>
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block">Pending Payout</span>
            <span className="text-2xl font-black text-hc-gold tabular-nums">{isClaimed ? fmt(connect?.balance?.pending_cents || 0) : '---'}</span>
          </div>
        </div>

        {/* Missed Money Module */}
        <div className="bg-gradient-to-br from-hc-danger/10 to-transparent border border-hc-danger/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-hc-danger/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-3">
            <div className="p-2 bg-hc-danger/20 rounded-lg shrink-0 mt-0.5 border border-hc-danger/20">
              <AlertCircle className="w-5 h-5 text-hc-danger" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-hc-danger tracking-wide uppercase mb-1">Missed Opportunities</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                You missed <strong className="text-white">{fmt(missed)}</strong> in direct run offers this month because your profile was offline. 
              </p>
              <button className="mt-3 flex items-center gap-1.5 text-xs font-bold text-hc-danger border-b border-hc-danger/30 pb-0.5 hover:border-hc-danger transition-colors uppercase tracking-wider">
                Go Live to Capture Runs <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="bg-[#121214] border border-hc-gold/20 rounded-2xl p-1 relative overflow-hidden group">
          <div className="absolute inset-0 bg-hc-gold/5 group-hover:bg-hc-gold/10 transition-colors pointer-events-none" />
          <Link href="/dashboard/operator" className="flex items-center justify-between p-4 relative z-10 w-full text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-hc-gold/10 rounded-lg border border-hc-gold/20 text-hc-gold shadow-[0_0_10px_rgba(212,168,68,0.2)]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-hc-gold mb-0.5 block">Recommended</span>
                <span className="text-sm font-bold text-white block">Update Next Available City</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/30" />
          </Link>
        </div>

        {/* Run Cards / Active Offers */}
        <section className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white/80 uppercase tracking-widest">Pending Run Offers</h2>
            <span className="bg-white/10 text-white/60 text-[10px] font-bold px-2 py-0.5 rounded-full">{isClaimed ? MOCK_RUNS.length : 0}</span>
          </div>

          <div className="space-y-3">
            {isClaimed ? (
              MOCK_RUNS.map((run) => (
                <div key={run.id} className="bg-[#121214] border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                  {/* Header row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-hc-gold font-bold mb-1 flex items-center gap-1">
                        <Banknote className="w-3 h-3" /> Direct Offer
                      </div>
                      <div className="text-xl font-black text-white">${run.rate}</div>
                    </div>
                    <div className="text-[10px] font-semibold text-white/40">{run.time}</div>
                  </div>
                  
                  {/* Route row */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90 truncate">{run.origin}</span>
                    <span className="text-white/30 text-xs">â†’</span>
                    <span className="text-sm font-bold text-white/90 truncate">{run.dest}</span>
                  </div>

                  {/* Standardized Action Row - Icon + Label Pills */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-hc-success/10 border border-hc-success/20 rounded-xl text-hc-success hover:bg-hc-success/20 transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wide uppercase">Accept</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-hc-danger/10 border border-hc-danger/20 rounded-xl text-hc-danger hover:bg-hc-danger/20 transition-colors">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wide uppercase">Decline</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-8 text-center border-dashed">
                <p className="text-sm text-white/40 mb-3">Offers are locked until claimed.</p>
                <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white/20" />
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
