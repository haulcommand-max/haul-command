'use client';

import { useEffect, useState } from 'react';

type ConnectStatus = {
  connected: boolean;
  onboarded: boolean;
  payouts_enabled: boolean;
  account_id?: string;
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

const fmt = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export default function EarningsDashboardPage() {
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'standard' | 'instant'>('standard');
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statusRes, payoutsRes] = await Promise.all([
        fetch('/api/connect/status'),
        fetch('/api/connect/payouts'),
      ]);
      if (statusRes.ok) setConnect(await statusRes.json());
      if (payoutsRes.ok) setPayouts(await payoutsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  async function startOnboarding() {
    const res = await fetch('/api/connect/onboard', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawStatus('loading');
    const amountCents = Math.round(parseFloat(withdrawAmount) * 100);
    const res = await fetch('/api/connect/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_cents: amountCents, method: withdrawMethod }),
    });
    if (res.ok) {
      setWithdrawStatus('success');
      setWithdrawAmount('');
      // Refresh
      const statusRes = await fetch('/api/connect/status');
      if (statusRes.ok) setConnect(await statusRes.json());
    } else {
      setWithdrawStatus('error');
    }
  }

  const availableDollars = (connect?.balance?.available_cents || 0) / 100;
  const pendingDollars = (connect?.balance?.pending_cents || 0) / 100;
  const instantFee = withdrawAmount ? (parseFloat(withdrawAmount) * 0.015).toFixed(2) : '0.00';
  const instantNet = withdrawAmount ? (parseFloat(withdrawAmount) * 0.985).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="text-amber-400">Haul Command Pay</span> \u2014 Earnings
        </h1>

        {/* Not connected */}
        {!connect?.connected && (
          <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
            <h2 className="text-xl font-bold mb-3">Set up direct payouts</h2>
            <p className="text-gray-400 mb-6">
              Connect your bank account to receive payments. Your bank statement will show{' '}
              <strong className="text-white">HAUL COMMAND PAY</strong> as the payer.
            </p>
            <button aria-label="Interactive Button"
              onClick={startOnboarding}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
            >
              Connect Bank Account
            </button>
          </div>
        )}

        {/* Connected but not fully onboarded */}
        {connect?.connected && !connect.onboarded && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6">
            <p className="text-amber-400 font-medium">Complete your account setup to enable payouts \u2192</p>
            <button aria-label="Interactive Button" onClick={startOnboarding} className="mt-3 text-sm text-amber-400 underline">
              Continue setup
            </button>
          </div>
        )}

        {/* Balance cards */}
        {connect?.connected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Available for Withdrawal</p>
              <p className="text-3xl font-bold text-green-400">${availableDollars.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">Ready to withdraw</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Pending</p>
              <p className="text-3xl font-bold text-amber-400">${pendingDollars.toFixed(2)}</p>
              <p className="text-xs text-gray-600 mt-1">In escrow or processing</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-sm text-gray-500 mb-1">Account Status</p>
              <p className={`text-lg font-bold ${connect.payouts_enabled ? 'text-green-400' : 'text-amber-400'}`}>
                {connect.payouts_enabled ? '\u2713 Payouts Active' : '\u23f3 Setup Pending'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Stripe Connect Express</p>
            </div>
          </div>
        )}

        {/* Withdraw form */}
        {connect?.payouts_enabled && availableDollars > 0 && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl mb-8">
            <h2 className="text-lg font-bold mb-4">Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableDollars}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="Enter amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button aria-label="Interactive Button"
                  type="button"
                  onClick={() => setWithdrawMethod('standard')}
                  className={`p-4 rounded-xl border text-sm text-left transition-all ${
                    withdrawMethod === 'standard'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="font-medium">Standard Payout</p>
                  <p className="text-gray-400 text-xs mt-0.5">2 business days \u2022 Free</p>
                </button>
                <button aria-label="Interactive Button"
                  type="button"
                  onClick={() => setWithdrawMethod('instant')}
                  className={`p-4 rounded-xl border text-sm text-left transition-all ${
                    withdrawMethod === 'instant'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="font-medium">Instant Payout</p>
                  <p className="text-gray-400 text-xs mt-0.5">~30 min \u2022 1.5% fee</p>
                  {withdrawAmount && (
                    <p className="text-amber-400 text-xs mt-1">
                      Fee: ${instantFee} \u2022 You receive: ${instantNet}
                    </p>
                  )}
                </button>
              </div>

              {withdrawStatus === 'success' && (
                <p className="text-green-400 text-sm">\u2713 Payout initiated! Check your bank account.</p>
              )}
              {withdrawStatus === 'error' && (
                <p className="text-red-400 text-sm">Payout failed. Contact support.</p>
              )}

              <button aria-label="Interactive Button"
                type="submit"
                disabled={!withdrawAmount || withdrawStatus === 'loading'}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {withdrawStatus === 'loading' ? 'Processing...' : 'Withdraw Funds'}
              </button>
            </form>
          </div>
        )}

        {/* Payout history */}
        <div>
          <h2 className="text-lg font-bold mb-4">Payout History</h2>
          {payouts.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No payouts yet. Complete your first job to start earning.
            </div>
          ) : (
            <div className="space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <p className="font-medium">${p.net_amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {p.payout_method === 'instant' ? 'Instant' : 'Standard'} \u2022{' '}
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {p.status}
                    </span>
                    {p.fee > 0 && (
                      <p className="text-xs text-gray-600 mt-0.5">Fee: ${p.fee.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
