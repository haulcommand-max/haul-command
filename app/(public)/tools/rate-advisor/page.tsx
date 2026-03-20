'use client';

/**
 * PRICING INTELLIGENCE ENGINE — /tools/rate-advisor
 * "What Should I Charge?" — the exact phrase operators search for
 * 
 * Free: rate range only
 * Pro: full breakdown with negotiation strategy
 */

import { useState } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, ChevronRight, Lock, Flame, Snowflake, Target } from 'lucide-react';

interface RateAdvice {
  rateRange: { low: number; mid: number; high: number; perMile: { low: number; mid: number; high: number } };
  corridorStatus: string;
  corridorStatusReason: string;
  negotiationCeiling: number;
  negotiationStrategy: string[];
  demandSignals: { currentDemand: string; supplyLevel: string; trendDirection: string };
  seasonalFactors: string;
  competitorInsight: string;
  bottomLine: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  HOT: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔥' },
  WARM: { color: '#f5a623', bg: 'rgba(245,166,35,0.1)', icon: '🟡' },
  COOL: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '🔵' },
  COLD: { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: '❄️' },
};

export default function RateAdvisorPage() {
  const [corridor, setCorridor] = useState('');
  const [loadType, setLoadType] = useState('Oversize');
  const [distance, setDistance] = useState('');
  const [date, setDate] = useState('');
  const [position, setPosition] = useState('Chase');
  const [advice, setAdvice] = useState<RateAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isPro = false; // TODO: wire to auth

  const getAdvice = async () => {
    setLoading(true);
    setError('');
    setAdvice(null);
    try {
      const res = await fetch('/api/tools/rate-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corridor, loadType, distance, date, position }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setAdvice(data.advice);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const sc = advice ? STATUS_CONFIG[advice.corridorStatus] || STATUS_CONFIG.COOL : null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0a1a0a, #0a0b10 60%)', borderBottom: '1px solid rgba(34,197,94,0.2)', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1 }}>💰 Stop Undercharging</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>What Should I Charge?</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>AI-powered rate intelligence — corridor pricing, demand signals, and negotiation strategy</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        {/* Input form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <input value={corridor} onChange={e => setCorridor(e.target.value)} placeholder="Corridor (e.g. Dallas TX → Atlanta GA, or I-10 Gulf Coast)" style={inputStyle} />
          </div>
          <select value={position} onChange={e => setPosition(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="Chase">Chase Car</option>
            <option value="Lead">Lead Car</option>
            <option value="High Pole">High Pole</option>
            <option value="Steer">Steer Car</option>
            <option value="Route Survey">Route Survey</option>
          </select>
          <select value={loadType} onChange={e => setLoadType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="Oversize">Oversize</option>
            <option value="Superload">Superload</option>
            <option value="Wide Load">Wide Load</option>
            <option value="Over-height">Over-height</option>
            <option value="General Heavy Haul">General Heavy Haul</option>
          </select>
          <input value={distance} onChange={e => setDistance(e.target.value)} placeholder="Distance (miles)" type="number" style={inputStyle} />
          <input value={date} onChange={e => setDate(e.target.value)} placeholder="Date of run" type="date" style={inputStyle} />
        </div>

        <button onClick={getAdvice} disabled={loading || !corridor.trim()} style={{ width: '100%', padding: '14px 24px', background: loading ? '#333' : 'linear-gradient(135deg, #22c55e, #059669)', border: 'none', borderRadius: 12, color: '#000', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .2s' }}>
          {loading ? '⏳ Analyzing Rates…' : '💰 Get Rate Intelligence'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 16, background: 'rgba(239,68,68,0.1)', borderLeft: '3px solid #ef4444', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        {/* Results */}
        {advice && (
          <div style={{ marginTop: 24 }}>
            {/* Corridor status badge */}
            {sc && (
              <div style={{ background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{sc.icon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: sc.color }}>{advice.corridorStatus} CORRIDOR</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{advice.corridorStatusReason}</div>
                </div>
              </div>
            )}

            {/* Rate range */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><DollarSign size={18} color="#22c55e" /><span style={{ fontWeight: 700, fontSize: 16 }}>Recommended Rate Range</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Low</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#94a3b8' }}>${advice.rateRange.low}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>${advice.rateRange.perMile.low.toFixed(2)}/mi</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(34,197,94,0.08)', borderRadius: 12, padding: '12px 0' }}>
                  <div style={{ fontSize: 11, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Target</div>
                  <div style={{ fontSize: 40, fontWeight: 900, color: '#22c55e' }}>${advice.rateRange.mid}</div>
                  <div style={{ fontSize: 14, color: '#4ade80', fontWeight: 600 }}>${advice.rateRange.perMile.mid.toFixed(2)}/mi</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>High</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#f5a623' }}>${advice.rateRange.high}</div>
                  <div style={{ fontSize: 12, color: '#475569' }}>${advice.rateRange.perMile.high.toFixed(2)}/mi</div>
                </div>
              </div>
              {/* Negotiation ceiling */}
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(245,166,35,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="#f5a623" />
                <span style={{ fontSize: 13, color: '#f5a623', fontWeight: 600 }}>Negotiate up to: ${advice.negotiationCeiling}/day</span>
              </div>
            </div>

            {/* Pro gate */}
            {!isPro ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(59,130,246,0.05))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <Lock size={24} color="#22c55e" style={{ marginBottom: 8 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Unlock Full Breakdown</h3>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Negotiation strategy, demand signals, seasonal factors, and competitor insights</p>
                <a href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: '#22c55e', color: '#000', fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}>
                  Upgrade to Pro — $99/mo <ChevronRight size={16} />
                </a>
              </div>
            ) : (
              <>
                {/* Demand signals */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <Flame size={18} color={advice.demandSignals.currentDemand === 'HIGH' ? '#ef4444' : '#f5a623'} />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Demand</div>
                    <div style={{ fontWeight: 700, color: advice.demandSignals.currentDemand === 'HIGH' ? '#ef4444' : '#f5a623' }}>{advice.demandSignals.currentDemand}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <Snowflake size={18} color={advice.demandSignals.supplyLevel === 'SHORTAGE' ? '#ef4444' : '#3b82f6'} />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Supply</div>
                    <div style={{ fontWeight: 700, color: advice.demandSignals.supplyLevel === 'SHORTAGE' ? '#ef4444' : '#3b82f6' }}>{advice.demandSignals.supplyLevel}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                    <TrendingUp size={18} color={advice.demandSignals.trendDirection === 'RISING' ? '#22c55e' : '#64748b'} />
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Trend</div>
                    <div style={{ fontWeight: 700, color: advice.demandSignals.trendDirection === 'RISING' ? '#22c55e' : '#64748b' }}>{advice.demandSignals.trendDirection}</div>
                  </div>
                </div>

                {/* Negotiation strategy */}
                <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>🗣 Negotiation Strategy</div>
                  {advice.negotiationStrategy.map((s, i) => (
                    <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#e2e8f0', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#f5a623' }}>•</span> {s}
                    </div>
                  ))}
                </div>

                {/* Bottom line */}
                <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, color: '#22c55e' }}>💡 Bottom Line</div>
                  <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>{advice.bottomLine}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
