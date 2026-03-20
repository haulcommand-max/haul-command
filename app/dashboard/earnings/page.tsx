'use client';

/**
 * OPERATOR EARNINGS TRACKER — /dashboard/earnings
 * 
 * Tracks: earnings per run, fuel cost, net profit per hour
 * Shows: running P&L, best/worst corridors, 30-day trend
 * Drives daily active usage — operators check after every run
 */

import { useState, useCallback } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Fuel, Clock, Map, Plus, BarChart2, Calendar } from 'lucide-react';

interface Run {
  id: string;
  date: string;
  corridor: string;
  loadType: string;
  grossRate: number;
  miles: number;
  hours: number;
  fuelCost: number;
  tolls: number;
  netProfit: number;
  profitPerHour: number;
  profitPerMile: number;
}

const DEFAULT_MPG = 12;
const DEFAULT_FUEL_PRICE = 3.89;

export default function EarningsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [mpg, setMpg] = useState(DEFAULT_MPG);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_FUEL_PRICE);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCorridor, setFormCorridor] = useState('');
  const [formLoadType, setFormLoadType] = useState('Chase');
  const [formRate, setFormRate] = useState('');
  const [formMiles, setFormMiles] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formTolls, setFormTolls] = useState('0');

  const addRun = useCallback(() => {
    const miles = parseFloat(formMiles) || 0;
    const hours = parseFloat(formHours) || 0;
    const grossRate = parseFloat(formRate) || 0;
    const tolls = parseFloat(formTolls) || 0;
    const fuelCost = (miles / mpg) * fuelPrice;
    const netProfit = grossRate - fuelCost - tolls;
    const profitPerHour = hours > 0 ? netProfit / hours : 0;
    const profitPerMile = miles > 0 ? netProfit / miles : 0;

    const run: Run = {
      id: Date.now().toString(),
      date: formDate,
      corridor: formCorridor || 'Unknown',
      loadType: formLoadType,
      grossRate,
      miles,
      hours,
      fuelCost: Math.round(fuelCost * 100) / 100,
      tolls,
      netProfit: Math.round(netProfit * 100) / 100,
      profitPerHour: Math.round(profitPerHour * 100) / 100,
      profitPerMile: Math.round(profitPerMile * 100) / 100,
    };

    setRuns(prev => [run, ...prev]);
    setShowForm(false);
    setFormCorridor('');
    setFormRate('');
    setFormMiles('');
    setFormHours('');
    setFormTolls('0');
  }, [formDate, formCorridor, formLoadType, formRate, formMiles, formHours, formTolls, mpg, fuelPrice]);

  // Calculations
  const totalGross = runs.reduce((s, r) => s + r.grossRate, 0);
  const totalFuel = runs.reduce((s, r) => s + r.fuelCost, 0);
  const totalTolls = runs.reduce((s, r) => s + r.tolls, 0);
  const totalNet = runs.reduce((s, r) => s + r.netProfit, 0);
  const totalMiles = runs.reduce((s, r) => s + r.miles, 0);
  const totalHours = runs.reduce((s, r) => s + r.hours, 0);
  const avgPerHour = totalHours > 0 ? totalNet / totalHours : 0;
  const avgPerMile = totalMiles > 0 ? totalNet / totalMiles : 0;

  // Corridor analysis
  const corridorMap: Record<string, { net: number; count: number; avgPerHour: number }> = {};
  runs.forEach(r => {
    if (!corridorMap[r.corridor]) corridorMap[r.corridor] = { net: 0, count: 0, avgPerHour: 0 };
    corridorMap[r.corridor].net += r.netProfit;
    corridorMap[r.corridor].count++;
  });
  Object.entries(corridorMap).forEach(([, v]) => { v.avgPerHour = v.net / Math.max(v.count, 1); });
  const corridors = Object.entries(corridorMap).sort((a, b) => b[1].net - a[1].net);
  const bestCorridor = corridors[0];
  const worstCorridor = corridors.length > 1 ? corridors[corridors.length - 1] : null;

  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a150a, #0a0b10 60%)', borderBottom: '1px solid rgba(34,197,94,0.2)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>💰 Earnings Tracker</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Track every run. See your real numbers. Optimize your routes.</p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px' }}>
        {/* Settings bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Fuel size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>MPG:</span>
            <input value={mpg} onChange={e => setMpg(Number(e.target.value) || 12)} type="number" style={{ ...inputStyle, width: 60, padding: '6px 8px' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <DollarSign size={14} color="#64748b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>Fuel $/gal:</span>
            <input value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value) || 3.89)} type="number" step="0.01" style={{ ...inputStyle, width: 70, padding: '6px 8px' }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 2 }}>
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: period === p ? 'rgba(34,197,94,0.15)' : 'transparent', color: period === p ? '#22c55e' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Gross Earnings', v: `$${totalGross.toLocaleString()}`, c: '#22c55e', icon: <DollarSign size={16} /> },
            { l: 'Fuel Costs', v: `-$${totalFuel.toFixed(0)}`, c: '#ef4444', icon: <Fuel size={16} /> },
            { l: 'Net Profit', v: `$${totalNet.toLocaleString()}`, c: totalNet >= 0 ? '#22c55e' : '#ef4444', icon: <TrendingUp size={16} /> },
            { l: 'Avg $/Hour', v: `$${avgPerHour.toFixed(2)}`, c: '#f5a623', icon: <Clock size={16} /> },
            { l: 'Avg $/Mile', v: `$${avgPerMile.toFixed(2)}`, c: '#3b82f6', icon: <Map size={16} /> },
            { l: 'Total Runs', v: `${runs.length}`, c: '#a855f7', icon: <BarChart2 size={16} /> },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#64748b' }}>{k.icon}<span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.l}</span></div>
              <div style={{ fontSize: 24, fontWeight: 800, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Corridor analysis */}
        {corridors.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {bestCorridor && (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><TrendingUp size={14} color="#22c55e" /><span style={{ fontSize: 11, color: '#22c55e', textTransform: 'uppercase', fontWeight: 700 }}>Best Corridor</span></div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{bestCorridor[0]}</div>
                <div style={{ fontSize: 13, color: '#22c55e' }}>${bestCorridor[1].net.toFixed(0)} net / {bestCorridor[1].count} runs</div>
              </div>
            )}
            {worstCorridor && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><TrendingDown size={14} color="#ef4444" /><span style={{ fontSize: 11, color: '#ef4444', textTransform: 'uppercase', fontWeight: 700 }}>Worst Corridor</span></div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{worstCorridor[0]}</div>
                <div style={{ fontSize: 13, color: '#ef4444' }}>${worstCorridor[1].net.toFixed(0)} net / {worstCorridor[1].count} runs</div>
              </div>
            )}
          </div>
        )}

        {/* Add run */}
        <button onClick={() => setShowForm(!showForm)} style={{ width: '100%', padding: '12px 20px', background: showForm ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #22c55e, #059669)', border: 'none', borderRadius: 12, color: showForm ? '#64748b' : '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Log a Run'}
        </button>

        {showForm && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Date</label><input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Corridor</label><input value={formCorridor} onChange={e => setFormCorridor(e.target.value)} placeholder="Dallas → Atlanta" style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Position</label>
                <select value={formLoadType} onChange={e => setFormLoadType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="Chase">Chase</option><option value="Lead">Lead</option><option value="High Pole">High Pole</option><option value="Steer">Steer</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Gross Rate ($)</label><input value={formRate} onChange={e => setFormRate(e.target.value)} type="number" placeholder="380" style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Miles</label><input value={formMiles} onChange={e => setFormMiles(e.target.value)} type="number" placeholder="450" style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Hours</label><input value={formHours} onChange={e => setFormHours(e.target.value)} type="number" step="0.5" placeholder="8" style={inputStyle} /></div>
              <div><label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Tolls ($)</label><input value={formTolls} onChange={e => setFormTolls(e.target.value)} type="number" placeholder="0" style={inputStyle} /></div>
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <div style={{ fontSize: 12, color: '#64748b', padding: '10px 0' }}>
                  Fuel est: <strong style={{ color: '#ef4444' }}>${((parseFloat(formMiles) || 0) / mpg * fuelPrice).toFixed(2)}</strong>
                </div>
              </div>
            </div>
            <button onClick={addRun} style={{ width: '100%', marginTop: 12, padding: '12px 20px', background: '#22c55e', border: 'none', borderRadius: 10, color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>✅ Save Run</button>
          </div>
        )}

        {/* Run history */}
        {runs.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={16} color="#64748b" /> Run History</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['Date', 'Corridor', 'Type', 'Gross', 'Fuel', 'Net', '$/Hr', '$/Mi'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12 }}>{r.date}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.corridor}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 4 }}>{r.loadType}</span></td>
                      <td style={{ padding: '10px 12px', color: '#22c55e', fontWeight: 600 }}>${r.grossRate}</td>
                      <td style={{ padding: '10px 12px', color: '#ef4444' }}>-${r.fuelCost}</td>
                      <td style={{ padding: '10px 12px', color: r.netProfit >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>${r.netProfit}</td>
                      <td style={{ padding: '10px 12px', color: '#f5a623' }}>${r.profitPerHour}</td>
                      <td style={{ padding: '10px 12px', color: '#3b82f6' }}>${r.profitPerMile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {runs.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📊</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No runs logged yet</p>
            <p style={{ fontSize: 13 }}>Tap &ldquo;Log a Run&rdquo; after every job to track your real earnings</p>
          </div>
        )}
      </div>
    </div>
  );
}
