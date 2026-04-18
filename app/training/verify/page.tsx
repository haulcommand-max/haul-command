'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function VerifyCertificationPage() {
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { valid: boolean; operator?: string; expires?: string; tier?: string; error?: string }>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setLoading(true);
    setResult(null);

    // Simulate verification check (in a real app, this would query Supabase API)
    setTimeout(() => {
      setLoading(false);
      // Mock logic: anything starting with "HC-" works
      const id = certId.trim().toUpperCase();
      if (id.startsWith('HC-') && id.length > 5) {
        setResult({
          valid: true,
          operator: 'John Doe',
          expires: '2027-04-15',
          tier: 'HC AV-Ready (Gold)',
        });
      } else {
        setResult({
          valid: false,
          error: 'No active certification found for this ID. Please ensure you entered the complete ID (e.g., HC-10294).',
        });
      }
    }, 1200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      color: '#e8e8e8',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <section style={{
        background: 'linear-gradient(160deg, #0c0c0c 0%, #101018 100%)',
        padding: '80px 24px 64px',
        textAlign: 'center',
        borderBottom: '1px solid #1a1a22',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 700, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700,
          color: '#22c55e', letterSpacing: '0.06em', marginBottom: 20,
        }}>
          ðŸ›¡ï¸ AUTHORIZED VERIFICATION
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 900, margin: '0 0 20px',
          letterSpacing: '-0.02em', lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 0%, #22c55e 70%, #fff 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Verify Pilot Car Certification
        </h1>

        <p style={{
          fontSize: 18, color: '#8a8a9a', maxWidth: 680, margin: '0 auto 48px', lineHeight: 1.65,
        }}>
          Check the real-time status of an operator's Haul Command credentials. 
          Instantly verify AV-Ready, Elite, or State-Specific compliance protocols.
        </p>

        <form onSubmit={handleVerify} style={{ maxWidth: 500, margin: '0 auto', display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Enter Cert ID (e.g. HC-94829)"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            style={{
              flex: 1, padding: '16px 20px', fontSize: 16,
              background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12,
              color: '#fff', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#22c55e')}
            onBlur={e => (e.currentTarget.style.borderColor = '#2a2a3a')}
          />
          <button aria-label="Interactive Button"
            type="submit"
            disabled={loading || !certId.trim()}
            style={{
              padding: '0 28px', background: loading ? '#166534' : '#22c55e',
              color: '#000', border: 'none', borderRadius: 12, fontSize: 16,
              fontWeight: 800, cursor: loading ? 'wait' : 'pointer', transition: 'transform 0.15s',
            }}
          >
            {loading ? 'Checking...' : 'Verify'}
          </button>
        </form>

        {result && (
          <div style={{
            maxWidth: 500, margin: '32px auto 0', padding: 24, borderRadius: 16,
            background: result.valid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${result.valid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            textAlign: 'left',
          }}>
            {result.valid ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#22c55e', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>âœ“</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Valid Certification</div>
                    <div style={{ fontSize: 13, color: '#22c55e' }}>Active & Verified</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <span style={{ color: '#8a8a9a', fontSize: 14 }}>Operator</span>
                    <strong style={{ color: '#fff' }}>{result.operator}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                    <span style={{ color: '#8a8a9a', fontSize: 14 }}>Certification Tier</span>
                    <strong style={{ color: '#F5A623' }}>{result.tier}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8a8a9a', fontSize: 14 }}>Valid Through</span>
                    <strong style={{ color: '#fff' }}>{result.expires}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ef4444', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>!</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>Verification Failed</div>
                </div>
                <p style={{ color: '#e8e8e8', fontSize: 14, margin: 0, lineHeight: 1.5 }}>{result.error}</p>
                <div style={{ marginTop: 16, fontSize: 13, color: '#8a8a9a' }}>
                  Need help? <Link href="/support" style={{ color: '#F5A623' }}>Contact Support</Link>
                </div>
              </>
            )}
          </div>
        )}
      </section>
      
      <section style={{ padding: '64px 24px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 16px', color: '#fff' }}>Trust Your Convoy</h2>
          <p style={{ color: '#8a8a9a', lineHeight: 1.6, marginBottom: 32 }}>
              Haul Command provides a globally recognized certification registry for Escort Operators. Avoid insurance disputes by verifying training credentials prior to dispatch.
          </p>
      </section>
    </div>
  );
}