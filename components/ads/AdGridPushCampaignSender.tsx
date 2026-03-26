'use client';

import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   AdGrid Push Campaign Sender — Admin Dashboard
   CLAUDE_UI_HANDOFF_TASKS.md §9
   Internal tool for configuring Novu-based sponsored push blasts
   ═══════════════════════════════════════════════════════════════ */

interface PushCampaign {
  id?: string;
  advertiser_name: string;
  message: string;
  target_segment: string;
  target_states: string[];
  schedule_type: 'immediate' | 'scheduled' | 'trigger';
  scheduled_at?: string;
  trigger_event?: string;
  budget_cents: number;
  max_sends: number;
  status?: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
}

interface Props {
  campaigns?: PushCampaign[];
  onSend?: (campaign: PushCampaign) => void;
  onSave?: (campaign: PushCampaign) => void;
}

const SEGMENTS = [
  { key: 'all_operators', label: 'All Operators', count: '~45K' },
  { key: 'verified', label: 'Verified Only', count: '~12K' },
  { key: 'trust_90', label: 'Trust 90%+', count: '~3.2K' },
  { key: 'active_7d', label: 'Active (7d)', count: '~8K' },
  { key: 'brokers', label: 'Brokers', count: '~2.1K' },
];

const TRIGGERS = [
  { key: 'near_weigh_station', label: 'Near Weigh Station' },
  { key: 'curfew_approaching', label: 'Curfew 45min' },
  { key: 'load_completed', label: 'Load Completed' },
  { key: 'idle_24h', label: 'Idle 24hr+' },
];

export function AdGridPushCampaignSender({ campaigns = [], onSend, onSave }: Props) {
  const [form, setForm] = useState<PushCampaign>({
    advertiser_name: '',
    message: '',
    target_segment: 'all_operators',
    target_states: [],
    schedule_type: 'immediate',
    budget_cents: 10000,
    max_sends: 5000,
  });
  const [preview, setPreview] = useState(false);
  const charCount = form.message.length;
  const charMax = 140;

  const update = (patch: Partial<PushCampaign>) => setForm(p => ({ ...p, ...patch }));

  return (
    <div className="agps">
      <div className="agps-header">
        <h3>📱 Push Campaign Builder</h3>
        <span className="agps-badge">AdGrid × Novu</span>
      </div>

      <div className="agps-grid">
        {/* Form */}
        <div className="agps-form">
          <div className="agps-field">
            <label>Advertiser</label>
            <input value={form.advertiser_name} onChange={e => update({ advertiser_name: e.target.value })} placeholder="Company name" />
          </div>

          <div className="agps-field">
            <label>Message ({charCount}/{charMax})</label>
            <textarea
              value={form.message}
              onChange={e => { if (e.target.value.length <= charMax) update({ message: e.target.value }); }}
              placeholder="140-character push notification text..."
              rows={3}
            />
            <div className="agps-char-bar">
              <div className="agps-char-fill" style={{ width: `${(charCount / charMax) * 100}%`, background: charCount > 120 ? '#EF4444' : '#C6923A' }} />
            </div>
          </div>

          <div className="agps-field">
            <label>Target Segment</label>
            <div className="agps-segments">
              {SEGMENTS.map(s => (
                <button
                  key={s.key}
                  className={`agps-seg ${form.target_segment === s.key ? 'agps-seg--active' : ''}`}
                  onClick={() => update({ target_segment: s.key })}
                >
                  <span>{s.label}</span>
                  <span className="agps-seg-count">{s.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="agps-field">
            <label>Schedule</label>
            <div className="agps-schedule">
              {(['immediate', 'scheduled', 'trigger'] as const).map(t => (
                <button key={t} className={`agps-sched ${form.schedule_type === t ? 'agps-sched--active' : ''}`} onClick={() => update({ schedule_type: t })}>
                  {t === 'immediate' ? '⚡ Now' : t === 'scheduled' ? '📅 Schedule' : '🎯 Trigger'}
                </button>
              ))}
            </div>
          </div>

          {form.schedule_type === 'trigger' && (
            <div className="agps-field">
              <label>Trigger Event</label>
              <div className="agps-triggers">
                {TRIGGERS.map(t => (
                  <button key={t.key} className={`agps-trig ${form.trigger_event === t.key ? 'agps-trig--active' : ''}`} onClick={() => update({ trigger_event: t.key })}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="agps-row">
            <div className="agps-field">
              <label>Budget</label>
              <input type="number" value={form.budget_cents / 100} onChange={e => update({ budget_cents: parseFloat(e.target.value) * 100 })} />
            </div>
            <div className="agps-field">
              <label>Max Sends</label>
              <input type="number" value={form.max_sends} onChange={e => update({ max_sends: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          <div className="agps-actions">
            <button className="agps-save" onClick={() => onSave?.(form)}>💾 Save Draft</button>
            <button className="agps-preview" onClick={() => setPreview(!preview)}>👁️ Preview</button>
            <button className="agps-send" onClick={() => onSend?.(form)} disabled={!form.message || !form.advertiser_name}>
              🚀 {form.schedule_type === 'immediate' ? 'Send Now' : 'Schedule'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="agps-phone">
            <div className="agps-phone-notch" />
            <div className="agps-phone-notif">
              <div className="agps-notif-icon">⬡</div>
              <div className="agps-notif-body">
                <div className="agps-notif-app">Haul Command • Sponsored</div>
                <div className="agps-notif-msg">{form.message || 'Your message here...'}</div>
              </div>
              <div className="agps-notif-time">now</div>
            </div>
          </div>
        )}
      </div>

      {/* Campaign list */}
      {campaigns.length > 0 && (
        <div className="agps-history">
          <h4>Recent Campaigns</h4>
          <div className="agps-table">
            <div className="agps-table-head">
              <span>Advertiser</span><span>Message</span><span>Segment</span><span>Status</span><span>Sends</span>
            </div>
            {campaigns.slice(0, 5).map((c, i) => (
              <div key={i} className="agps-table-row">
                <span>{c.advertiser_name}</span>
                <span className="agps-table-msg">{c.message}</span>
                <span>{c.target_segment}</span>
                <span className={`agps-status agps-status--${c.status}`}>{c.status}</span>
                <span>{c.max_sends.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .agps { background:linear-gradient(180deg,#0E1019,#080A10); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:20px; color:#F0F0F0; }
        .agps-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .agps-header h3 { margin:0; font-size:18px; font-weight:700; }
        .agps-badge { font-size:10px; font-weight:600; color:#888; padding:4px 10px; background:rgba(255,255,255,0.04); border-radius:6px; }
        .agps-grid { display:grid; grid-template-columns:1fr auto; gap:20px; align-items:start; }
        @media (max-width:768px) { .agps-grid { grid-template-columns:1fr; } }
        .agps-form { display:flex; flex-direction:column; gap:14px; }
        .agps-field { display:flex; flex-direction:column; gap:6px; }
        .agps-field label { font-size:11px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.05em; }
        .agps-field input, .agps-field textarea { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10); border-radius:10px; padding:10px 14px; font-size:14px; color:#F0F0F0; outline:none; font-family:inherit; resize:none; }
        .agps-field input:focus, .agps-field textarea:focus { border-color:rgba(198,146,58,0.5); }
        .agps-char-bar { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin-top:4px; }
        .agps-char-fill { height:100%; border-radius:2px; transition:all 0.2s; }
        .agps-segments { display:flex; flex-wrap:wrap; gap:6px; }
        .agps-seg { display:flex; align-items:center; gap:6px; padding:6px 12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; font-size:12px; font-weight:600; color:#888; cursor:pointer; transition:all 0.15s; }
        .agps-seg--active { background:rgba(198,146,58,0.1); border-color:rgba(198,146,58,0.4); color:#C6923A; }
        .agps-seg-count { font-size:10px; color:#555; }
        .agps-schedule { display:flex; gap:6px; }
        .agps-sched { padding:8px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:8px; font-size:12px; font-weight:600; color:#888; cursor:pointer; }
        .agps-sched--active { background:rgba(198,146,58,0.1); border-color:rgba(198,146,58,0.4); color:#C6923A; }
        .agps-triggers { display:flex; flex-wrap:wrap; gap:6px; }
        .agps-trig { padding:6px 10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:6px; font-size:11px; font-weight:600; color:#888; cursor:pointer; }
        .agps-trig--active { background:rgba(159,122,234,0.1); border-color:rgba(159,122,234,0.4); color:#9F7AEA; }
        .agps-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .agps-actions { display:flex; gap:8px; margin-top:4px; }
        .agps-save, .agps-preview { padding:10px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); border-radius:10px; color:#ccc; font-size:13px; font-weight:600; cursor:pointer; }
        .agps-send { flex:1; padding:10px 16px; background:linear-gradient(135deg,#C6923A,#8A6428); border:none; border-radius:10px; color:#000; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.15s; }
        .agps-send:disabled { opacity:0.4; cursor:not-allowed; }
        .agps-send:hover:not(:disabled) { box-shadow:0 4px 16px rgba(198,146,58,0.3); }
        .agps-phone { width:220px; background:#000; border-radius:24px; padding:12px; border:2px solid #333; }
        .agps-phone-notch { width:80px; height:6px; background:#222; border-radius:4px; margin:0 auto 16px; }
        .agps-phone-notif { background:rgba(255,255,255,0.08); border-radius:14px; padding:10px; display:flex; gap:8px; }
        .agps-notif-icon { width:28px; height:28px; background:linear-gradient(135deg,#C6923A,#8A6428); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
        .agps-notif-body { flex:1; min-width:0; }
        .agps-notif-app { font-size:9px; color:#888; font-weight:600; }
        .agps-notif-msg { font-size:11px; color:#F0F0F0; margin-top:2px; line-height:1.4; }
        .agps-notif-time { font-size:9px; color:#555; flex-shrink:0; }
        .agps-history { margin-top:20px; border-top:1px solid rgba(255,255,255,0.06); padding-top:16px; }
        .agps-history h4 { margin:0 0 10px; font-size:14px; color:#888; }
        .agps-table-head, .agps-table-row { display:grid; grid-template-columns:1fr 2fr 1fr 80px 80px; gap:8px; padding:8px 10px; font-size:11px; }
        .agps-table-head { color:#555; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; border-bottom:1px solid rgba(255,255,255,0.06); }
        .agps-table-row { color:#ccc; border-bottom:1px solid rgba(255,255,255,0.03); }
        .agps-table-msg { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .agps-status { font-weight:700; font-size:10px; text-transform:uppercase; }
        .agps-status--active { color:#22C55E; }
        .agps-status--completed { color:#3B82F6; }
        .agps-status--draft { color:#888; }
        .agps-status--paused { color:#F59E0B; }
      `}</style>
    </div>
  );
}
