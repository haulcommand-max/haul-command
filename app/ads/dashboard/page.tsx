'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Zap,
  Plus,
  Target,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Globe,
  MapPin,
  Users,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'draft' | 'ended';
  budget_usd: number;
  spent_usd: number;
  impressions: number;
  clicks: number;
  cpm: number;
  target_states: string[];
  target_keywords: string[];
  created_at: string;
  start_date: string;
  end_date?: string;
  ad_type: 'banner' | 'native' | 'push' | 'intercept';
}

type CreateStep = 'type' | 'targeting' | 'creative' | 'budget' | 'review';

const AD_TYPES = [
  { id: 'native', label: 'Native Ad Card', description: 'Embedded in operator directory listings. Highest CTR.', cpmFrom: 8 },
  { id: 'banner', label: 'Hero Billboard', description: 'Top-of-page placement across state/city pages.', cpmFrom: 5 },
  { id: 'push',   label: 'Push Campaign', description: 'Delivered to operator notification inbox. Maximum reach.', cpmFrom: 12 },
  { id: 'intercept', label: 'Keyword Intercept', description: 'Fires when operators search specific keywords.', cpmFrom: 15 },
];

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:  { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  label: '● Active' },
  paused:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.3)',  label: '⏸ Paused' },
  draft:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: '✎ Draft' },
  ended:   { color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', label: '✓ Ended' },
};

function fmtUSD(n: number) { return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtNum(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Icon size={13} color={color} /> {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Campaign Row ─────────────────────────────────────────────────────────────
function CampaignRow({ c, onToggle }: { c: Campaign; onToggle: (id: string, status: 'active' | 'paused') => void }) {
  const ss = STATUS_STYLES[c.status];
  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0.00';
  const pct = c.budget_usd > 0 ? Math.min(100, (c.spent_usd / c.budget_usd) * 100) : 0;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Type badge */}
        <div style={{ flexShrink: 0, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
          {c.ad_type}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ss.color, background: ss.bg, border: `1px solid ${ss.border}`, borderRadius: 8, padding: '2px 8px' }}>{ss.label}</span>
              {(c.status === 'active' || c.status === 'paused') && (
                <button
                  onClick={() => onToggle(c.id, c.status === 'active' ? 'paused' : 'active')}
                  style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '2px 10px', cursor: 'pointer' }}
                >
                  {c.status === 'active' ? 'Pause' : 'Resume'}
                </button>
              )}
            </div>
          </div>

          {/* Budget bar */}
          <div style={{ marginTop: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
              <span>Budget: {fmtUSD(c.spent_usd)} / {fmtUSD(c.budget_usd)}</span>
              <span>{pct.toFixed(0)}% used</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? '#ef4444' : pct > 70 ? '#fbbf24' : '#34d399', borderRadius: 2, transition: 'width 0.4s' }} />
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Impressions', value: fmtNum(c.impressions) },
              { label: 'Clicks', value: fmtNum(c.clicks) },
              { label: 'CTR', value: `${ctr}%` },
              { label: 'CPM', value: fmtUSD(c.cpm) },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Creator Modal ────────────────────────────────────────────────────
function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [step, setStep] = useState<CreateStep>('type');
  const [adType, setAdType] = useState<string>('native');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('500');
  const [states, setStates] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('pilot car, escort, heavy haul');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const US_STATES = ['TX','FL','CA','GA','LA','OK','MS','AL','TN','OR','WA','MT','ID','WY','CO','AZ','NV','UT','NM','KS','NE','SD','ND','MN','IA','WI','IL','IN','OH','MI','PA','NY','VA','NC','SC','KY','WV','MD','NJ','CT','MA','VT','NH','ME','AK','HI'];

  const toggleState = (s: string) => setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    if (!name.trim() || parseFloat(budget) < 50) { setError('Campaign name and minimum $50 budget required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ad_type: adType,
          budget_usd: parseFloat(budget),
          target_states: states,
          target_keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          creative: { headline, body },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign');
      onCreated(data.campaign ?? {
        id: `draft-${Date.now()}`, name, status: 'draft', budget_usd: parseFloat(budget), spent_usd: 0,
        impressions: 0, clicks: 0, cpm: AD_TYPES.find(a => a.id === adType)?.cpmFrom ?? 8,
        target_states: states, target_keywords: keywords.split(',').map(k => k.trim()),
        created_at: new Date().toISOString(), start_date: new Date().toISOString(), ad_type: adType as any,
      });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const Steps: CreateStep[] = ['type', 'targeting', 'creative', 'budget', 'review'];
  const stepIdx = Steps.indexOf(step);

  const Btn = ({ label, disabled, onClick, primary }: { label: string; disabled?: boolean; onClick: () => void; primary?: boolean }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ padding: '11px 22px', background: primary ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)', border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: primary ? '#fff' : '#94a3b8', fontWeight: 700, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: 540, background: 'linear-gradient(160deg, #0d1320, #060810)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 24, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Progress */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#f1f5f9' }}>New Ad Campaign</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 20 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {Steps.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? '#6366f1' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Step: Type */}
          {step === 'type' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b' }}>Select the ad format that fits your campaign goal:</p>
              {AD_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setAdType(t.id)}
                  style={{ textAlign: 'left', padding: '14px 16px', background: adType === t.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${adType === t.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: adType === t.id ? '#818cf8' : '#e2e8f0' }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>from ${t.cpmFrom} CPM</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>{t.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step: Targeting */}
          {step === 'targeting' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Campaign Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Texas Pilot Car Summer Push" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Target States <span style={{ color: '#334155' }}>(leave empty = nationwide)</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {US_STATES.map(s => (
                    <button key={s} onClick={() => toggleState(s)} style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: `1px solid ${states.includes(s) ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, background: states.includes(s) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: states.includes(s) ? '#818cf8' : '#64748b', cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Target Keywords (comma-separated)</label>
                <input value={keywords} onChange={e => setKeywords(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 13, outline: 'none' }} />
              </div>
            </div>
          )}

          {/* Step: Creative */}
          {step === 'creative' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Headline</label>
                <input value={headline} onChange={e => setHeadline(e.target.value)} maxLength={60} placeholder="60 char max" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569', textAlign: 'right' }}>{headline.length}/60</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Body Copy</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={150} rows={4} placeholder="150 char max" style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical' }} />
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#475569', textAlign: 'right' }}>{body.length}/150</p>
              </div>
              {/* Live preview */}
              {headline && (
                <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: 14 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ad Preview</p>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>{headline || 'Your headline here'}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{body || 'Your body copy here...'}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Budget */}
          {step === 'budget' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total Campaign Budget (USD)</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0 14px', marginBottom: 16 }}>
                <span style={{ color: '#64748b', fontSize: 18, fontWeight: 700 }}>$</span>
                <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min={50} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 22, fontWeight: 800, padding: '14px 10px', fontVariantNumeric: 'tabular-nums' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[250, 500, 1000, 2500, 5000].map(v => (
                  <button key={v} onClick={() => setBudget(String(v))} style={{ padding: '7px 14px', background: budget === String(v) ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${budget === String(v) ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: budget === String(v) ? '#818cf8' : '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, color: '#64748b' }}>
                  Estimated reach at ${AD_TYPES.find(a => a.id === adType)?.cpmFrom ?? 8} CPM:
                </p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
                  ~{((parseFloat(budget || '0') / (AD_TYPES.find(a => a.id === adType)?.cpmFrom ?? 8)) * 1000).toLocaleString()} impressions
                </p>
              </div>
            </div>
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Campaign Name', value: name },
                  { label: 'Format',         value: AD_TYPES.find(a => a.id === adType)?.label ?? adType },
                  { label: 'Target States',  value: states.length > 0 ? states.join(', ') : 'Nationwide' },
                  { label: 'Keywords',       value: keywords },
                  { label: 'Headline',       value: headline || '(none)' },
                  { label: 'Budget',         value: fmtUSD(parseFloat(budget || '0')) },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {error && (
                <div style={{ display: 'flex', gap: 8, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', marginTop: 16 }}>
                  <AlertTriangle size={14} color="#f87171" />
                  <p style={{ margin: 0, fontSize: 12, color: '#f87171' }}>{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          {stepIdx > 0 ? <Btn label="← Back" onClick={() => setStep(Steps[stepIdx - 1])} /> : <div />}
          {step !== 'review'
            ? <Btn label="Next →" primary onClick={() => setStep(Steps[stepIdx + 1])} />
            : <button onClick={handleCreate} disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', background: 'linear-gradient(135deg, #34d399, #059669)', border: 'none', borderRadius: 12, color: '#000', fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
                {submitting ? 'Launching...' : 'Launch Campaign'}
              </button>
          }
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Main AdGrid Dashboard ────────────────────────────────────────────────────
export default function AdGridDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch('/api/ads/campaigns');
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns ?? []);
        }
      } catch {}
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  const handleToggle = async (id: string, newStatus: 'active' | 'paused') => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    await fetch(`/api/ads/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };

  // Aggregate stats
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpent       = campaigns.reduce((s, c) => s + c.spent_usd, 0);
  const avgCTR           = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const activeCnt        = campaigns.filter(c => c.status === 'active').length;

  return (
    <div style={{ minHeight: '100vh', background: '#060810', color: '#e2e8f0', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={c => setCampaigns(prev => [c, ...prev])}
        />
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={18} color="#818cf8" />
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>
                Haul Command <span style={{ color: '#818cf8' }}>AdGrid</span>
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              {activeCnt} active campaign{activeCnt !== 1 ? 's' : ''} · Reach 1.5M+ logistics operators
            </p>
          </div>
          <button
            id="create-campaign-btn"
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
          >
            <Plus size={15} /> New Campaign
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
          <StatCard label="Total Impressions" value={fmtNum(totalImpressions)} sub="All time" icon={Eye} color="#60a5fa" />
          <StatCard label="Total Clicks" value={fmtNum(totalClicks)} sub={`${avgCTR}% CTR`} icon={MousePointerClick} color="#34d399" />
          <StatCard label="Total Spent" value={fmtUSD(totalSpent)} sub="This billing cycle" icon={DollarSign} color="#fbbf24" />
          <StatCard label="Active Campaigns" value={String(activeCnt)} sub={`${campaigns.length} total`} icon={Zap} color="#fb923c" />
        </div>

        {/* Campaigns list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Your Campaigns</h2>
          {campaigns.length > 0 && <span style={{ fontSize: 12, color: '#475569' }}>{campaigns.length} total</span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={28} color="#6366f1" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
            <Target size={40} color="#334155" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: '#475569' }}>No campaigns yet</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#334155' }}>Launch your first ad to reach 1.5M+ logistics operators across 57 countries.</p>
            <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
              <Plus size={15} /> Create First Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map(c => <CampaignRow key={c.id} c={c} onToggle={handleToggle} />)}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
