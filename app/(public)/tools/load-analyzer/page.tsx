'use client';

/**
 * LOAD INTELLIGENCE ANALYZER — /tools/load-analyzer
 * 
 * Broker/operator pastes load details â†’ AI returns:
 * - Profit Score (0-100) + Risk Score (0-100)
 * - Hidden Costs (escorts, police, night restrictions)
 * - Recommendation: Accept / Negotiate / Decline
 * 
 * Free: Profit Score only | Pro: Full report
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Shield, DollarSign, ChevronRight, Lock, Zap, Eye, Truck } from 'lucide-react';
import { useProStatus } from '@/hooks/useProStatus';

interface Analysis {
  profitScore: number;
  riskScore: number;
  profitGrade: string;
  riskGrade: string;
  hiddenCosts: { item: string; estimatedCost: string; reason: string }[];
  recommendation: string;
  recommendationReason: string;
  corridorInsight: string;
  rateAnalysis: { offeredRate: string; marketAverage: string; rateVerdict: string };
  escortRequirements: { chaseCarsNeeded: number; leadCarsNeeded: number; highPoleNeeded: boolean; policeEscortLikely: boolean; nightRestrictions: boolean; weekendRestrictions: boolean };
  warnings: string[];
}

const GRADE_COLORS: Record<string, string> = {
  A: '#22c55e', B: '#84cc16', C: '#f5a623', D: '#f97316', F: '#ef4444',
};
const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f5a623', HIGH: '#f97316', EXTREME: '#ef4444',
};
const REC_COLORS: Record<string, string> = {
  ACCEPT: '#22c55e', NEGOTIATE: '#f5a623', DECLINE: '#ef4444',
};
const REC_ICONS: Record<string, string> = {
  ACCEPT: 'âœ…', NEGOTIATE: 'âš ï¸', DECLINE: 'âŒ',
};

export default function LoadAnalyzerPage() {
  const [mode, setMode] = useState<'paste' | 'fields'>('paste');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [weight, setWeight] = useState('');
  const [loadType, setLoadType] = useState('Oversize');
  const [offeredRate, setOfferedRate] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isPro } = useProStatus();

  const analyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const res = await fetch('/api/tools/load-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'paste' ? { description } : { origin, destination, dimensions, weight, loadType, offeredRate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a0a0a, #0a0b10 60%)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 1 }}>âš ï¸ Avoid Bad Loads</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Load Intelligence Analyzer</h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>AI-powered load analysis — profit score, risk assessment, hidden costs, and go/no-go recommendation</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
          {[{ k: 'paste', l: 'ðŸ“‹ Paste Load Description' }, { k: 'fields', l: 'ðŸ“ Fill in Fields' }].map(m => (
            <button aria-label="Interactive Button" key={m.k} onClick={() => setMode(m.k as 'paste' | 'fields')} style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: mode === m.k ? 'rgba(245,166,35,0.12)' : 'transparent', color: mode === m.k ? '#f5a623' : '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .2s' }}>{m.l}</button>
          ))}
        </div>

        {/* Input */}
        {mode === 'paste' ? (
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Paste load posting here"¦&#10;&#10;Example: Load Alert!! FCI 9092527549 Atlanta GA to Los Angeles CA, 14'6&quot; wide x 16' tall transformer, $1.80/mi, need Chase + High Pole, Quick Pay available" rows={5} style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin (e.g. Houston, TX)" style={inputStyle} />
            <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination (e.g. Atlanta, GA)" style={inputStyle} />
            <input value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="Dimensions (e.g. 14'W x 16'H x 80'L)" style={inputStyle} />
            <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (e.g. 120,000 lbs)" style={inputStyle} />
            <select value={loadType} onChange={e => setLoadType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="Oversize">Oversize Load</option>
              <option value="Superload">Superload</option>
              <option value="Overweight">Overweight</option>
              <option value="Over-dimensional">Over-dimensional</option>
              <option value="Wide Load">Wide Load</option>
            </select>
            <input value={offeredRate} onChange={e => setOfferedRate(e.target.value)} placeholder="Offered Rate (e.g. $1.80/mi or $1,300 flat)" style={inputStyle} />
          </div>
        )}

        <button aria-label="Interactive Button" onClick={analyze} disabled={loading || (!description.trim() && !origin.trim())} style={{ width: '100%', padding: '14px 24px', background: loading ? '#333' : 'linear-gradient(135deg, #f5a623, #ef4444)', border: 'none', borderRadius: 12, color: '#000', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 12, transition: 'all .2s' }}>
          {loading ? 'â³ Analyzing"¦' : 'âš¡ Analyze This Load'}
        </button>

        {error && <div style={{ marginTop: 16, padding: 16, background: 'rgba(239,68,68,0.1)', borderLeft: '3px solid #ef4444', borderRadius: 8, color: '#fca5a5', fontSize: 13 }}>{error}</div>}

        {/* Results */}
        {analysis && (
          <div style={{ marginTop: 24 }}>
            {/* Score cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Profit Score</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: GRADE_COLORS[analysis.profitGrade] || '#f5a623' }}>{analysis.profitScore}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: GRADE_COLORS[analysis.profitGrade] }}>{analysis.profitGrade}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Risk Score</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: RISK_COLORS[analysis.riskGrade] || '#f5a623' }}>{analysis.riskScore}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: RISK_COLORS[analysis.riskGrade] }}>{analysis.riskGrade} RISK</div>
              </div>
              <div style={{ background: `rgba(${analysis.recommendation === 'ACCEPT' ? '34,197,94' : analysis.recommendation === 'NEGOTIATE' ? '245,166,35' : '239,68,68'},0.08)`, border: `1px solid ${REC_COLORS[analysis.recommendation]}30`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Verdict</div>
                <div style={{ fontSize: 36 }}>{REC_ICONS[analysis.recommendation]}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: REC_COLORS[analysis.recommendation], marginTop: 4 }}>{analysis.recommendation}</div>
              </div>
            </div>

            {/* Recommendation */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Zap size={16} color="#f5a623" /><span style={{ fontWeight: 700, fontSize: 14 }}>Recommendation</span></div>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{analysis.recommendationReason}</p>
            </div>

            {/* Pro gate */}
            {!isPro ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(239,68,68,0.05))', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                <Lock size={24} color="#f5a623" style={{ marginBottom: 8 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Unlock Full Report</h3>
                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>Hidden costs, escort requirements, rate analysis, and corridor insights</p>
                <a href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: '#f5a623', color: '#000', fontWeight: 700, fontSize: 14, borderRadius: 10, textDecoration: 'none' }}>
                  Upgrade to Pro — $99/mo <ChevronRight size={16} />
                </a>
              </div>
            ) : (
              <>
                {/* Rate Analysis */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><DollarSign size={16} color="#22c55e" /><span style={{ fontWeight: 700 }}>Rate Analysis</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Offered</div><div style={{ fontWeight: 700, color: '#e2e8f0' }}>{analysis.rateAnalysis.offeredRate}</div></div>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Market Avg</div><div style={{ fontWeight: 700, color: '#22c55e' }}>{analysis.rateAnalysis.marketAverage}</div></div>
                    <div><div style={{ fontSize: 11, color: '#64748b' }}>Verdict</div><div style={{ fontWeight: 700, color: analysis.rateAnalysis.rateVerdict.includes('BELOW') ? '#ef4444' : '#22c55e' }}>{analysis.rateAnalysis.rateVerdict.replace(/_/g, ' ')}</div></div>
                  </div>
                </div>

                {/* Hidden Costs */}
                {analysis.hiddenCosts.length > 0 && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><AlertTriangle size={16} color="#ef4444" /><span style={{ fontWeight: 700, color: '#fca5a5' }}>Hidden Costs Detected</span></div>
                    {analysis.hiddenCosts.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < analysis.hiddenCosts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{c.item}</div><div style={{ fontSize: 11, color: '#64748b' }}>{c.reason}</div></div>
                        <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 14 }}>{c.estimatedCost}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Escort Requirements */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Truck size={16} color="#3b82f6" /><span style={{ fontWeight: 700 }}>Escort Requirements</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { l: 'Chase Cars', v: analysis.escortRequirements.chaseCarsNeeded },
                      { l: 'Lead Cars', v: analysis.escortRequirements.leadCarsNeeded },
                      { l: 'High Pole', v: analysis.escortRequirements.highPoleNeeded ? 'YES' : 'No' },
                      { l: 'Police Escort', v: analysis.escortRequirements.policeEscortLikely ? 'âš ï¸ LIKELY' : 'No' },
                      { l: 'Night Restrict', v: analysis.escortRequirements.nightRestrictions ? 'âš ï¸ YES' : 'No' },
                      { l: 'Weekend Restrict', v: analysis.escortRequirements.weekendRestrictions ? 'âš ï¸ YES' : 'No' },
                    ].map((r, i) => (
                      <div key={i} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>{r.l}</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: typeof r.v === 'string' && r.v.includes('âš ï¸') ? '#f5a623' : '#e2e8f0' }}>{r.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Corridor Insight */}
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Eye size={16} color="#3b82f6" /><span style={{ fontWeight: 700 }}>Corridor Insight</span></div>
                  <p style={{ color: '#94a3b8', fontSize: 14 }}>{analysis.corridorInsight}</p>
                </div>

                {/* Warnings */}
                {analysis.warnings?.length > 0 && (
                  <div style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Shield size={16} color="#f5a623" /><span style={{ fontWeight: 700 }}>Warnings</span></div>
                    {analysis.warnings.map((w, i) => (
                      <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#f5a623' }}>âš ï¸ {w}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}