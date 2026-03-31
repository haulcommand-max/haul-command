'use client';

import { useState } from 'react';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

export default function PermitRequestPage() {
  const [origin, setOrigin] = useState('');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ height: '', width: '', length: '', weight: '' });
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleState = (st: string) => {
    setDestinations(prev => prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/permits/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin_state: origin, destination_states: destinations, load_dimensions: dimensions, needed_by_date: neededBy, notes }),
    });
    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Permit Request Submitted</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Qualified agents will be notified. Expect quotes within 2 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Request Permits</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Describe your route and load. Verified permit agents will quote you.</p>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Origin State</label>
          <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}>
            <option value="">Select origin state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Destination States (tap all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {US_STATES.map(s => (
              <button aria-label="Interactive Button" key={s} onClick={() => toggleState(s)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: destinations.includes(s) ? '#00ff88' : 'rgba(255,255,255,0.15)', background: destinations.includes(s) ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)', color: destinations.includes(s) ? '#00ff88' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {['height','width','length','weight'].map(dim => (
            <div key={dim}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'capitalize' }}>{dim} {dim === 'weight' ? '(lbs)' : '(ft)'}</label>
              <input type="number" value={(dimensions as any)[dim]} onChange={e => setDimensions(prev => ({ ...prev, [dim]: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Needed By Date</label>
          <input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, resize: 'vertical' }} placeholder="Any special requirements..." />
        </div>

        <button aria-label="Interactive Button" onClick={handleSubmit} disabled={!origin || destinations.length === 0} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: origin && destinations.length > 0 ? 'linear-gradient(135deg, #00ff88, #00d4ff)' : 'rgba(255,255,255,0.1)', color: origin && destinations.length > 0 ? '#000' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, cursor: origin && destinations.length > 0 ? 'pointer' : 'not-allowed' }}>Submit Permit Request</button>
      </div>
    </div>
  );
}
