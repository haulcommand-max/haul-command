'use client';

import { useState } from 'react';

interface BreakdownButtonProps {
  jobId: string;
  corridor?: string;
  originalRate?: number;
}

export function ReportBreakdownButton({ jobId, corridor, originalRate = 380 }: BreakdownButtonProps) {
  const [reporting, setReporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [miles, setMiles] = useState({ completed: '', remaining: '' });

  const handleReport = async () => {
    setReporting(true);
    try {
      const res = await fetch('/api/emergency/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          miles_completed: Number(miles.completed) || 0,
          miles_remaining: Number(miles.remaining) || 0,
          original_rate: originalRate,
        }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } catch { /* handled by UI */ }
    setReporting(false);
  };

  if (result) {
    return (
      <div style={{ padding: 16, background: 'rgba(0,212,255,0.08)', borderRadius: 10, border: '1px solid rgba(0,212,255,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff', marginBottom: 4 }}>🚨 Replacement Dispatched</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{result.operators_notified} operators notified. Premium rate: ${result.premium_rate?.toFixed(0)}/day</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Your partial payment: ${result.partial_payment?.toFixed(2)}</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div style={{ padding: 16, background: 'rgba(255,59,48,0.06)', borderRadius: 10, border: '1px solid rgba(255,59,48,0.15)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#ff3b30', marginBottom: 12 }}>🚨 Report Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Miles Completed</label>
            <input type="number" value={miles.completed} onChange={e => setMiles(p => ({ ...p, completed: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Miles Remaining</label>
            <input type="number" value={miles.remaining} onChange={e => setMiles(p => ({ ...p, remaining: e.target.value }))} style={{ width: '100%', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={handleReport} disabled={reporting} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: '#ff3b30', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{reporting ? 'Dispatching...' : 'Dispatch Replacement'}</button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🚨 Report Breakdown</button>
  );
}
