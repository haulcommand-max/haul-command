'use client';

import { useState } from 'react';
import Link from 'next/link';

const US_STATES = [
  { code: 'TX', name: 'Texas' }, { code: 'CA', name: 'California' },
  { code: 'FL', name: 'Florida' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'WY', name: 'Wyoming' }, { code: 'MT', name: 'Montana' },
  { code: 'CO', name: 'Colorado' }, { code: 'LA', name: 'Louisiana' },
  { code: 'OH', name: 'Ohio' }, { code: 'MI', name: 'Michigan' },
  { code: 'GA', name: 'Georgia' }, { code: 'NC', name: 'North Carolina' },
  { code: 'IN', name: 'Indiana' }, { code: 'MN', name: 'Minnesota' },
  { code: 'AZ', name: 'Arizona' }, { code: 'WA', name: 'Washington' },
  { code: 'OR', name: 'Oregon' }, { code: 'NM', name: 'New Mexico' },
];

interface QuoteResult {
  states: string[];
  permit_type: string;
  line_items: Array<{ state: string; description: string; amount_cents: number }>;
  total_cents: number;
  pricing_tier: string;
  estimated_processing_days: number;
}

export default function PermitFilingPage() {
  const [step, setStep] = useState<'configure' | 'quote' | 'checkout'>('configure');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [permitType, setPermitType] = useState('oversize');
  const [rush, setRush] = useState(false);
  const [dimensions, setDimensions] = useState({ width_ft: '', height_ft: '', length_ft: '', weight_lbs: '' });
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleState = (code: string) => {
    setSelectedStates(prev =>
      prev.includes(code) ? prev.filter(s => s !== code) : [...prev, code]
    );
  };

  const getQuote = async () => {
    if (!selectedStates.length) return;
    setLoading(true);
    const res = await fetch('/api/permits/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ states: selectedStates, permit_type: permitType, dimensions, rush }),
    });
    const data = await res.json();
    setQuote(data);
    setStep('quote');
    setLoading(false);
  };

  const checkout = async () => {
    setLoading(true);
    const res = await fetch('/api/permits/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ states: selectedStates, permit_type: permitType, dimensions, route: {}, rush }),
    });
    const data = await res.json();
    if (data.checkout_url) window.location.href = data.checkout_url;
    else setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#0c0c10',
    border: '1px solid #2a2a3a', borderRadius: 8, color: '#e8e8e8',
    fontSize: 14, boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #07090f, #0d1422)', borderBottom: '1px solid #1a1a22', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 16, background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#F5A623', fontSize: 11, fontWeight: 700, marginBottom: 20, letterSpacing: '0.1em' }}>
            📋 NEW — AUTOMATED PERMIT FILING
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1 }}>
            File Your Oversize Permits in Minutes
          </h1>
          <p style={{ color: '#8a8aa0', fontSize: 16, maxWidth: 560, margin: '0 auto 0' }}>
            Select states, enter your load dimensions, and we file the permits automatically.
            DOT-compliant. Delivered to your email. No phone calls.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {step === 'configure' && (
          <>
            {/* Step 1: States */}
            <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 16, padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
                1. Select states on your route
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {US_STATES.map(s => {
                  const selected = selectedStates.includes(s.code);
                  return (
                    <button aria-label="Interactive Button" key={s.code} onClick={() => toggleState(s.code)} style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: selected ? 'rgba(245,166,35,0.15)' : '#0c0c10',
                      border: `1px solid ${selected ? '#F5A623' : '#2a2a3a'}`,
                      color: selected ? '#F5A623' : '#8a8aa0',
                    }}>
                      {s.code} — {s.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>
              {selectedStates.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#6a6a7a' }}>
                  Selected: <strong style={{ color: '#F5A623' }}>{selectedStates.join(', ')}</strong>
                  {selectedStates.length >= 3 && <span style={{ color: '#22c55e', marginLeft: 8 }}>✓ Multi-state discount applied</span>}
                </div>
              )}
            </div>

            {/* Step 2: Permit Type */}
            <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 16, padding: 28, marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>2. Permit type</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { val: 'oversize', label: 'Oversize', sub: '$29.99/state', color: '#3b82f6' },
                  { val: 'oilfield', label: 'Oilfield Equipment', sub: '$34.99/state', color: '#F5A623' },
                  { val: 'annual', label: 'Annual Blanket', sub: '$75/state/yr', color: '#a855f7' },
                ].map(opt => (
                  <button aria-label="Interactive Button" key={opt.val} onClick={() => setPermitType(opt.val)} style={{
                    padding: '12px 18px', borderRadius: 10, cursor: 'pointer',
                    background: permitType === opt.val ? `rgba(${opt.color === '#3b82f6' ? '59,130,246' : opt.color === '#F5A623' ? '245,166,35' : '168,85,247'},0.15)` : '#0c0c10',
                    border: `1px solid ${permitType === opt.val ? opt.color : '#2a2a3a'}`,
                    color: permitType === opt.val ? opt.color : '#8a8aa0',
                    textAlign: 'left',
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{opt.sub}</div>
                  </button>
                ))}
              </div>

              {/* Rush option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
                <input type="checkbox" checked={rush} onChange={e => setRush(e.target.checked)}
                  style={{ width: 16, height: 16 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Rush processing (+$20)</div>
                  <div style={{ fontSize: 12, color: '#6a6a7a' }}>Same-day filing, typically processed within 4 business hours</div>
                </div>
              </label>
            </div>

            {/* Step 3: Dimensions */}
            <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 16, padding: 28, marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>3. Load dimensions</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { key: 'width_ft', label: 'Width (ft)' },
                  { key: 'height_ft', label: 'Height (ft)' },
                  { key: 'length_ft', label: 'Length (ft)' },
                  { key: 'weight_lbs', label: 'Weight (lbs)' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, color: '#6a6a7a', display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input
                      type="number"
                      value={dimensions[f.key as keyof typeof dimensions]}
                      onChange={e => setDimensions(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.key === 'weight_lbs' ? '80000' : '14'}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            <button aria-label="Interactive Button" onClick={getQuote} disabled={!selectedStates.length || loading} style={{
              width: '100%', padding: 16, background: selectedStates.length
                ? 'linear-gradient(135deg, #F5A623, #e08820)'
                : '#1a1a22',
              color: selectedStates.length ? '#000' : '#5a5a6a',
              border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: selectedStates.length ? 'pointer' : 'not-allowed',
            }}>
              {loading ? 'Calculating...' : `Get Quote for ${selectedStates.length} State${selectedStates.length !== 1 ? 's' : ''} →`}
            </button>
          </>
        )}

        {step === 'quote' && quote && (
          <div style={{ background: '#111118', border: '1px solid #1a1a22', borderRadius: 16, padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Your Permit Quote</h2>

            {/* Line items */}
            <div style={{ marginBottom: 20 }}>
              {quote.line_items.map(item => (
                <div key={item.state} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0', borderBottom: '1px solid #1a1a22', fontSize: 14,
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#F5A623' }}>
                    ${(item.amount_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #F5A623', marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Total</div>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#F5A623' }}>
                ${(quote.total_cents / 100).toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 14, marginBottom: 24, fontSize: 13 }}>
              ✓ Estimated filing time: <strong style={{ color: '#22c55e' }}>{quote.estimated_processing_days} business day{quote.estimated_processing_days !== 1 ? 's' : ''}</strong> ·
              Permit delivered to your email · Stored in your dashboard
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button aria-label="Interactive Button" onClick={() => setStep('configure')} style={{
                padding: '12px 20px', borderRadius: 10, background: '#0c0c10',
                border: '1px solid #2a2a3a', color: '#8a8aa0', fontSize: 14, cursor: 'pointer',
              }}>
                ← Edit
              </button>
              <button aria-label="Interactive Button" onClick={checkout} disabled={loading} style={{
                flex: 1, padding: 14, background: 'linear-gradient(135deg, #F5A623, #e08820)',
                color: '#000', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}>
                {loading ? 'Redirecting to checkout...' : 'Pay & File Permits →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
