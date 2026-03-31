'use client';

import { useState } from 'react';

interface QuickPayModalProps {
  jobId: string;
  invoiceAmount: number;
  onClose: () => void;
}

export function QuickPayModal({ jobId, invoiceAmount, onClose }: QuickPayModalProps) {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const feePercent = 3;
  const feeAmount = Number((invoiceAmount * feePercent / 100).toFixed(2));
  const advanceAmount = Number((invoiceAmount - feeAmount).toFixed(2));

  const handleQuickPay = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/quickpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, invoice_amount: invoiceAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'QuickPay failed');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 32, maxWidth: 440, width: '90%', border: '1px solid rgba(255,255,255,0.1)' }}>
        {result ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>QuickPay Processed!</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20, fontSize: 14 }}>{result.message}</p>
            <div style={{ padding: 16, background: 'rgba(0,255,136,0.08)', borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#00ff88' }}>${result.advance_amount?.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>deposited to your account</div>
            </div>
            <button aria-label="Interactive Button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Done</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>⚡ QuickPay</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>Get paid now instead of waiting Net 30</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Invoice Total</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>${invoiceAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,59,48,0.06)', borderRadius: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>QuickPay Fee ({feePercent}%)</span>
                <span style={{ color: '#ff3b30', fontWeight: 700 }}>-${feeAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(0,255,136,0.08)', borderRadius: 8, border: '1px solid rgba(0,255,136,0.2)' }}>
                <span style={{ color: '#00ff88', fontSize: 15, fontWeight: 700 }}>You Receive Now</span>
                <span style={{ color: '#00ff88', fontSize: 18, fontWeight: 800 }}>${advanceAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              • Funds deposited within 1 business day<br />
              • Escrow-backed — zero risk to you<br />
              • Alternative: wait for broker payment (Net 30)
            </div>

            {error && <p style={{ color: '#ff3b30', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button aria-label="Interactive Button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Wait for Net 30</button>
              <button aria-label="Interactive Button" onClick={handleQuickPay} disabled={processing} style={{ flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>{processing ? 'Processing...' : `Get $${advanceAmount.toFixed(2)} Now`}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
