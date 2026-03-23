'use client';

/**
 * Post-Job Intel Prompt — 3-question crowdsource after every completed job.
 * Each submission earns 5 trust score points.
 * After 3 operators verify the same point → "Confirmed" badge.
 */

import { useState } from 'react';

interface PostJobIntelProps {
  loadId: string;
  operatorId: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export default function PostJobIntel({ loadId, operatorId, onComplete, onDismiss }: PostJobIntelProps) {
  const [clearanceConcerns, setClearanceConcerns] = useState('');
  const [strictCheckpoint, setStrictCheckpoint] = useState<boolean | null>(null);
  const [timingIssues, setTimingIssues] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await fetch('/api/routes/intel/report', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          load_id: loadId,
          operator_id: operatorId,
          clearance_concerns: clearanceConcerns || null,
          strict_checkpoints: strictCheckpoint ?? false,
          timing_issues: timingIssues || null,
        }),
      });
      setSubmitted(true);
      onComplete?.();
    } catch { /* non-critical */ }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{
        background: 'rgba(10,15,25,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(34,197,94,0.3)', borderRadius: 16, padding: 24,
        textAlign: 'center', maxWidth: 440, margin: '0 auto',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e', marginBottom: 8 }}>+5 Trust Points</div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>
          Your intel makes the road safer for every operator. After 3 people verify the same point, it gets a Confirmed badge on the map.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(10,15,25,0.95)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(241,169,27,0.2)', borderRadius: 16, padding: 24,
      maxWidth: 440, margin: '0 auto',
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        🗺️ Route Intel — Earn 5 Trust Points
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#f5f5f5', marginBottom: 20 }}>
        Help fellow operators on this corridor
      </div>

      {/* Q1 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          1. Any clearance concerns on this route?
        </label>
        <textarea
          value={clearanceConcerns}
          onChange={(e) => setClearanceConcerns(e.target.value)}
          placeholder="e.g. Bridge on Hwy 90 at mile marker 47 looks tighter than posted..."
          rows={2}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f5f5f5', outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      {/* Q2 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          2. Any strict checkpoints?
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(v => (
            <button key={String(v)} onClick={() => setStrictCheckpoint(v)} style={{
              padding: '8px 20px', borderRadius: 8,
              background: strictCheckpoint === v ? (v ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)') : 'transparent',
              border: `1px solid ${strictCheckpoint === v ? (v ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)') : 'rgba(255,255,255,0.1)'}`,
              color: strictCheckpoint === v ? (v ? '#ef4444' : '#22c55e') : '#64748b',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>{v ? 'Yes' : 'No'}</button>
          ))}
        </div>
      </div>

      {/* Q3 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
          3. Any timing issues?
        </label>
        <textarea
          value={timingIssues}
          onChange={(e) => setTimingIssues(e.target.value)}
          placeholder="e.g. Construction zone delay near exit 42, added 45 min..."
          rows={2}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f5f5f5', outline: 'none', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSubmit} disabled={submitting} style={{
          flex: 1, padding: '12px 24px', borderRadius: 10,
          background: 'linear-gradient(135deg, #F1A91B, #d97706)',
          color: '#0a0f19', fontWeight: 900, fontSize: 14, border: 'none',
          cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1,
        }}>
          {submitting ? 'Submitting...' : 'Submit Intel (+5 pts)'}
        </button>
        {onDismiss && (
          <button onClick={onDismiss} style={{
            padding: '12px 16px', borderRadius: 10, background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
            fontSize: 12, cursor: 'pointer',
          }}>Skip</button>
        )}
      </div>
    </div>
  );
}
