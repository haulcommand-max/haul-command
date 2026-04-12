'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function QuickPayPage() {
  const [jobId, setJobId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const amount = parseFloat(invoiceAmount) || 0;
  const fee = Math.round(amount * 0.03 * 100) / 100;
  const advance = Math.round((amount - fee) * 100) / 100;

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quickpay/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, invoice_amount: amount }),
      });
      const data = await res.json();
      if (data.ok) setResult(data);
      else alert(data.error || 'Failed');
    } catch { alert('Network error'); }
    setLoading(false);
    setShowConfirm(false);
  };

  if (result) {
    return (
      <div className=" flex items-center justify-center text-white" style={{ background: '#060b12' }}>
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">ðŸ’°</div>
          <h1 className="text-2xl font-black mb-2">QuickPay Complete!</h1>
          <div className="mt-6 space-y-3" style={{ background: 'rgba(14,17,24,0.95)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
            <div className="flex justify-between"><span className="text-xs text-[#5A6577]">Invoice</span><span className="text-sm font-black text-white">${result.invoice_amount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-xs text-[#5A6577]">Fee ({result.fee_percentage}%)</span><span className="text-sm font-bold text-red-400">-${result.fee_amount.toFixed(2)}</span></div>
            <div className="border-t border-white/[0.06] pt-3 flex justify-between"><span className="text-xs font-bold text-emerald-400">Advanced to You</span><span className="text-lg font-black text-emerald-400">${result.advance_amount.toFixed(2)}</span></div>
          </div>
          <p className="text-xs text-[#8fa3b8] mt-4">Funds will appear in your account within 1 business day.</p>
          <Link aria-label="Navigation Link" href="/dashboard" className="text-sm font-bold text-[#C6923A] hover:underline mt-6 inline-block">Back to Dashboard â†’</Link>
        </div>
      </div>
    );
  }

  return (
    <div className=" text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .qp-card{background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;}
        .qp-highlight{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02));border:1px solid rgba(16,185,129,0.2);border-radius:16px;padding:24px;}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link aria-label="Navigation Link" href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
          <span className="text-[#5A6577] mx-2">/</span>
          <span className="text-sm font-semibold text-white">QuickPay</span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">âš¡</div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">QuickPay</h1>
          <p className="text-sm text-[#8fa3b8]">Get paid now instead of waiting net-30. 97% of your invoice, instantly.</p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="qp-card text-center">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-2">Standard</div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-mono, monospace)' }}>100%</div>
            <div className="text-[10px] text-[#5A6577] mt-1">Net 30 days</div>
          </div>
          <div className="qp-highlight text-center">
            <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2">QuickPay</div>
            <div className="text-2xl font-black text-emerald-400" style={{ fontFamily: 'var(--font-mono, monospace)' }}>97%</div>
            <div className="text-[10px] text-emerald-400/60 mt-1">Instant (3% fee)</div>
          </div>
        </div>

        {/* Form */}
        <div className="qp-card">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Job ID</label>
              <input type="text" value={jobId} onChange={e => setJobId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white" placeholder="Enter job ID" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider block mb-2">Invoice Amount ($)</label>
              <input type="number" step="0.01" min="0" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white" placeholder="380.00" />
            </div>
          </div>

          {amount > 0 && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs"><span className="text-[#5A6577]">Invoice</span><span className="font-bold text-white">${amount.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-[#5A6577]">QuickPay Fee (3%)</span><span className="font-bold text-red-400">-${fee.toFixed(2)}</span></div>
              <div className="border-t border-white/[0.06] pt-2 flex justify-between"><span className="text-xs font-bold text-emerald-400">You receive now</span><span className="text-lg font-black text-emerald-400">${advance.toFixed(2)}</span></div>
            </div>
          )}

          {!showConfirm ? (
            <button aria-label="Interactive Button" onClick={() => setShowConfirm(true)} disabled={!jobId || amount <= 0}
              className="w-full mt-6 py-4 rounded-xl font-black text-sm transition-all"
              style={{ background: amount > 0 ? 'linear-gradient(135deg,#10b981,#34d399)' : 'rgba(255,255,255,0.04)', color: amount > 0 ? '#0a0a0f' : '#5A6577' }}>
              Get Paid Now â†’
            </button>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="text-xs text-center text-[#8fa3b8]">Confirm: Receive <strong className="text-emerald-400">${advance.toFixed(2)}</strong> now with a <strong className="text-red-400">${fee.toFixed(2)}</strong> fee?</div>
              <div className="flex gap-3">
                <button aria-label="Interactive Button" onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl text-xs font-bold bg-white/[0.04] text-[#8fa3b8] border border-white/[0.06]">Cancel</button>
                <button aria-label="Interactive Button" onClick={handleRequest} disabled={loading} className="flex-1 py-3 rounded-xl text-xs font-black" style={{ background: 'linear-gradient(135deg,#10b981,#34d399)', color: '#0a0a0f' }}>
                  {loading ? 'Processing...' : 'Confirm QuickPay'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] text-[#5A6577]">QuickPay is only available for jobs with pre-funded escrow. Zero risk â€” funds are already held.</p>
        </div>
      </main>
    </div>
  );
}