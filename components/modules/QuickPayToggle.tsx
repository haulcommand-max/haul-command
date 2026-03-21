"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Banknote, Clock, ShieldCheck, Zap, AlertTriangle, CheckCircle2,
    ArrowRight, TrendingUp, DollarSign, History, Loader2
} from 'lucide-react';

interface QuickPayToggleProps {
    bookingId: string;
    brokerId: string;
    grossAmountCents: number;
    currency?: string;
    operatorHasConnect?: boolean;
}

interface QuickPayResult {
    status: string;
    transaction_id: string;
    gross_amount: number;
    fee_amount: number;
    fee_percentage: number;
    net_payout: number;
    payout_method: string;
    payout_eta: string;
}

interface QuickPayHistory {
    id: string;
    gross_amount_cents: number;
    fee_amount_cents: number;
    net_payout_cents: number;
    status: string;
    requested_at: string;
    completed_at: string | null;
    stripe_transfer_id: string | null;
    currency: string;
}

export default function QuickPayToggle({
    bookingId,
    brokerId,
    grossAmountCents,
    currency = 'usd',
    operatorHasConnect = false,
}: QuickPayToggleProps) {
    const [step, setStep] = useState<'offer' | 'confirm' | 'processing' | 'success' | 'error' | 'no_connect'>('offer');
    const [result, setResult] = useState<QuickPayResult | null>(null);
    const [error, setError] = useState<string>('');
    const [history, setHistory] = useState<QuickPayHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const supabase = createClient();

    const feePercent = 2.50;
    const feeCents = Math.round(grossAmountCents * (feePercent / 100));
    const netCents = grossAmountCents - feeCents;

    useEffect(() => {
        if (!operatorHasConnect) {
            setStep('no_connect');
        }
        loadHistory();
    }, []);

    async function loadHistory() {
        const { data } = await supabase
            .from('quickpay_transactions')
            .select('*')
            .order('requested_at', { ascending: false })
            .limit(5);
        if (data) setHistory(data);
    }

    async function processQuickPay() {
        setStep('processing');
        try {
            const res = await fetch('/api/payments/quickpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    booking_id: bookingId,
                    broker_id: brokerId,
                    gross_amount_cents: grossAmountCents,
                    currency,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error || 'QuickPay failed');
                setStep('error');
                return;
            }

            setResult(json);
            setStep('success');
            loadHistory();
        } catch (e: any) {
            setError(e.message || 'Network error');
            setStep('error');
        }
    }

    const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    // ── No Stripe Connect ──
    if (step === 'no_connect') {
        return (
            <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-white">QuickPay Available</h3>
                        <p className="text-xs text-slate-400">Get paid in minutes, not months</p>
                    </div>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                    Connect your bank account to receive instant payouts via QuickPay. One-time setup, takes 5 minutes.
                </p>
                <a
                    href="/operator/connect-stripe"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500
                        text-black font-black rounded-xl text-sm w-full justify-center
                        hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                    Connect Bank Account <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        );
    }

    // ── Success ──
    if (step === 'success' && result) {
        return (
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-xl">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">Payout Initiated!</h3>
                    <p className="text-sm text-slate-400">
                        {result.payout_method === 'instant'
                            ? 'Money is on its way — arriving in minutes.'
                            : 'Transfer initiated — arriving in 1-2 business days.'}
                    </p>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-sm">Invoice Total</span>
                        <span className="font-bold text-white">${result.gross_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                        <span className="text-slate-400 text-sm">{result.fee_percentage}% QuickPay Fee</span>
                        <span className="font-bold text-red-400">-${result.fee_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <span className="text-emerald-400 font-bold text-sm">Your Payout</span>
                        <span className="text-emerald-400 font-black text-xl">${result.net_payout.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-center text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {result.payout_eta}</span>
                    <span className="mx-2">·</span>
                    <span>Method: {result.payout_method === 'instant' ? '⚡ Instant' : '🏦 Standard'}</span>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (step === 'error') {
        return (
            <div className="bg-slate-900/80 border border-red-500/20 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-white">QuickPay Unavailable</h3>
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                </div>
                <button
                    onClick={() => setStep('offer')}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // ── Processing ──
    if (step === 'processing') {
        return (
            <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl p-8 backdrop-blur-xl text-center">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-1">Processing QuickPay</h3>
                <p className="text-sm text-slate-400">Running risk checks and initiating transfer...</p>
            </div>
        );
    }

    // ── Confirm ──
    if (step === 'confirm') {
        return (
            <div className="bg-slate-900/80 border border-amber-500/20 rounded-3xl p-6 backdrop-blur-xl">
                <h3 className="text-xl font-black text-white mb-1">Confirm QuickPay</h3>
                <p className="text-sm text-slate-400 mb-6">
                    You'll receive {formatUsd(netCents)} after the {feePercent}% fee.
                </p>

                <div className="space-y-2 mb-6">
                    <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-slate-400 text-sm">Invoice</span>
                        <span className="font-bold text-white">{formatUsd(grossAmountCents)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-500/5 rounded-xl">
                        <span className="text-slate-400 text-sm">{feePercent}% Fee</span>
                        <span className="font-bold text-red-400">-{formatUsd(feeCents)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <span className="text-amber-400 font-bold">You Receive</span>
                        <span className="text-amber-400 font-black text-xl">{formatUsd(netCents)}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setStep('offer')}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={processQuickPay}
                        className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black
                            rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                    >
                        Confirm & Pay Instantly
                    </button>
                </div>
            </div>
        );
    }

    // ── Initial Offer ──
    return (
        <div className="bg-slate-900/80 border border-white/5 hover:border-amber-500/20 rounded-3xl p-6 backdrop-blur-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl">
                        <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg">QuickPay</h3>
                        <p className="text-xs text-slate-400">Get paid in minutes, not months</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-500">Payout</div>
                    <div className="text-xl font-black text-amber-500">{formatUsd(netCents)}</div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6 p-3 bg-white/[0.03] rounded-xl">
                <div className="flex-1 text-center">
                    <div className="text-xs text-slate-500 mb-1">Invoice</div>
                    <div className="font-bold text-white text-sm">{formatUsd(grossAmountCents)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex-1 text-center">
                    <div className="text-xs text-red-400 mb-1">-{feePercent}% fee</div>
                    <div className="font-bold text-red-400 text-sm">{formatUsd(feeCents)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex-1 text-center">
                    <div className="text-xs text-amber-400 mb-1">You Get</div>
                    <div className="font-black text-amber-500 text-sm">{formatUsd(netCents)}</div>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <button
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors text-sm"
                >
                    Wait for Payment
                </button>
                <button
                    onClick={() => setStep('confirm')}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black
                        rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/25 transition-all
                        flex items-center justify-center gap-2"
                >
                    <Zap className="w-4 h-4" /> Get Paid Now
                </button>
            </div>

            {/* History Toggle */}
            {history.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <History className="w-3 h-3" />
                        {showHistory ? 'Hide' : 'Show'} QuickPay History ({history.length})
                    </button>

                    {showHistory && (
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                            {history.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl text-sm">
                                    <div>
                                        <span className="text-white font-semibold">{formatUsd(tx.net_payout_cents)}</span>
                                        <span className="text-slate-500 text-xs ml-2">
                                            {new Date(tx.requested_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                        tx.status === 'transferring' ? 'bg-amber-500/10 text-amber-400' :
                                        tx.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                        'bg-slate-500/10 text-slate-400'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
