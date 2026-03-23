'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { LoadDimensions } from '@/lib/routes/types';
const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

export default function RouteCheckPage() {
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const [dims, setDims] = useState<LoadDimensions>({ width_m: 4.0, height_m: 4.5, length_m: 25, weight_kg: 45000 });
  const [origin, setOrigin] = useState({ lat: '', lng: '' });
  const [dest, setDest] = useState({ lat: '', lng: '' });
  const [result, setResult] = useState<any>(null);
  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial');
  const ftM = (ft: number) => ft * 0.3048;
  const mFt = (m: number) => m / 0.3048;
  const lbKg = (lb: number) => lb * 0.453592;
  const kgLb = (kg: number) => kg / 0.453592;

  const calc = useCallback(async () => {
    if (!origin.lat || !dest.lat) return;
    setStep('loading');
    try {
      const r = await fetch('/api/routes/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: { lat: +origin.lat, lng: +origin.lng }, destination: { lat: +dest.lat, lng: +dest.lng }, load_dimensions: dims, country_code: 'US' }),
      });
      setResult(await r.json());
      setStep('results');
    } catch { setStep('form'); }
  }, [origin, dest, dims]);

  const cs: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f19', color: '#f5f5f5' }}>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#F1A91B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>🗺️ FREE ROUTE INTELLIGENCE TOOL</div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, margin: '0 0 8px' }}>Check Your Route Before You Run</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', maxWidth: 600 }}>Enter load dimensions and route. See every low bridge, weight restriction, and checkpoint. Free — no login.</p>
      </div>

      {step === 'form' && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={cs}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>📐 Load Dimensions</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['imperial', 'metric'] as const).map(u => (
                  <button key={u} onClick={() => setUnit(u)} style={{ padding: '6px 14px', borderRadius: 6, background: unit === u ? 'rgba(241,169,27,0.15)' : 'transparent', border: `1px solid ${unit === u ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.1)'}`, color: unit === u ? '#F1A91B' : '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{u === 'imperial' ? 'ft / lbs' : 'm / kg'}</button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label={`Width (${unit === 'imperial' ? 'ft' : 'm'})`} value={unit === 'imperial' ? mFt(dims.width_m).toFixed(1) : String(dims.width_m)} onChange={v => setDims(d => ({ ...d, width_m: unit === 'imperial' ? ftM(+v || 0) : +v || 0 }))} />
                <Inp label={`Height (${unit === 'imperial' ? 'ft' : 'm'})`} value={unit === 'imperial' ? mFt(dims.height_m).toFixed(1) : String(dims.height_m)} onChange={v => setDims(d => ({ ...d, height_m: unit === 'imperial' ? ftM(+v || 0) : +v || 0 }))} />
                <Inp label={`Length (${unit === 'imperial' ? 'ft' : 'm'})`} value={unit === 'imperial' ? mFt(dims.length_m).toFixed(1) : String(dims.length_m)} onChange={v => setDims(d => ({ ...d, length_m: unit === 'imperial' ? ftM(+v || 0) : +v || 0 }))} />
                <Inp label={`Weight (${unit === 'imperial' ? 'lbs' : 'kg'})`} value={unit === 'imperial' ? Math.round(kgLb(dims.weight_kg)).toString() : String(dims.weight_kg)} onChange={v => setDims(d => ({ ...d, weight_kg: unit === 'imperial' ? lbKg(+v || 0) : +v || 0 }))} />
              </div>
            </div>
            <div style={cs}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>📍 Origin</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label="Latitude" value={origin.lat} onChange={v => setOrigin(o => ({ ...o, lat: v }))} ph="29.7604" />
                <Inp label="Longitude" value={origin.lng} onChange={v => setOrigin(o => ({ ...o, lng: v }))} ph="-95.3698" />
              </div>
            </div>
            <div style={cs}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>🏁 Destination</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label="Latitude" value={dest.lat} onChange={v => setDest(d => ({ ...d, lat: v }))} ph="32.7767" />
                <Inp label="Longitude" value={dest.lng} onChange={v => setDest(d => ({ ...d, lng: v }))} ph="-96.7970" />
              </div>
            </div>
          </div>
          <button onClick={calc} style={{ marginTop: 24, width: '100%', maxWidth: 400, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #F1A91B, #d97706)', color: '#0a0f19', fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer' }}>Calculate Route Intelligence →</button>
        </div>
      )}

      {step === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🗺️</div>
            <div style={{ color: '#F1A91B', fontWeight: 700 }}>Calculating route intelligence...</div>
          </div>
        </div>
      )}

      {step === 'results' && result && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          <RiskBanner r={result.risk_summary} dist={result.total_distance_km} hrs={result.estimated_duration_hours} />
          <div style={{ height: 500, borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
            <HeavyHaulMap mode="public" loadDimensions={dims} showHud={false}
              initialCenter={[(+origin.lng + +dest.lng) / 2, (+origin.lat + +dest.lat) / 2]} initialZoom={6} />
          </div>
          {result.clearance_warnings?.length > 0 && <ClearanceTable warnings={result.clearance_warnings} />}
          <div style={{ marginTop: 32, padding: '24px', borderRadius: 16, textAlign: 'center', background: 'rgba(241,169,27,0.05)', border: '1px solid rgba(241,169,27,0.2)' }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Want real-time convoy tracking?</div>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>Sign up for permit route enforcement, convoy coordination, and clearance alerts.</p>
            <a href="/onboarding" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg, #F1A91B, #d97706)', color: '#0a0f19', fontWeight: 900, textDecoration: 'none' }}>Start Free →</a>
          </div>
          <button onClick={() => { setStep('form'); setResult(null); }} style={{ marginTop: 16, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>← Check Another Route</button>
        </div>
      )}
    </div>
  );
}

function Inp({ label, value, onChange, ph }: { label: string; value: string; onChange: (v: string) => void; ph?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4, textTransform: 'uppercase' }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f5f5', outline: 'none' }} />
    </div>
  );
}

function RiskBanner({ r, dist, hrs }: { r: any; dist: number; hrs: number }) {
  const c = r.overall_risk === 'blocked' ? '#ef4444' : r.overall_risk === 'high' ? '#f97316' : r.overall_risk === 'low' ? '#22c55e' : '#fbbf24';
  return (
    <div style={{ padding: '16px 24px', borderRadius: 12, marginBottom: 20, background: `rgba(${c === '#ef4444' ? '239,68,68' : c === '#f97316' ? '249,115,22' : c === '#22c55e' ? '34,197,94' : '251,191,36'},0.1)`, border: `1px solid ${c}33`, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
      <Stat lbl="Risk" val={r.overall_risk.toUpperCase()} col={c} />
      <Stat lbl="Distance" val={`${dist} km`} />
      <Stat lbl="Est. Time" val={`${hrs}h`} />
      <Stat lbl="Clearance Warnings" val={String(r.total_clearance_warnings)} col={r.total_clearance_warnings > 0 ? '#ef4444' : '#22c55e'} />
      <Stat lbl="Weight Violations" val={String(r.weight_violations)} col={r.weight_violations > 0 ? '#f97316' : '#22c55e'} />
    </div>
  );
}

function Stat({ lbl, val, col }: { lbl: string; val: string; col?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{lbl}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: col ?? '#f5f5f5' }}>{val}</div>
    </div>
  );
}

function ClearanceTable({ warnings }: { warnings: any[] }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>⚠️ Clearance Warnings ({warnings.length})</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {['Type', 'Road', 'Posted', 'Margin', 'Risk'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
        </tr></thead>
        <tbody>{warnings.map((w: any) => (
          <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>{w.obstacle_type}</td>
            <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>{w.road_name ?? 'Unknown'}</td>
            <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>{w.clearance_posted_m?.toFixed(1)}m</td>
            <td style={{ padding: '8px 10px', color: w.risk_level === 'blocked' ? '#ef4444' : '#f97316' }}>{w.margin_m > 0 ? '+' : ''}{w.margin_m?.toFixed(2)}m</td>
            <td style={{ padding: '8px 10px', fontWeight: 700, color: w.risk_level === 'blocked' ? '#ef4444' : '#f97316' }}>{w.risk_level?.toUpperCase()}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
