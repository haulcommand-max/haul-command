'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Prefs {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  load_match_push: boolean;
  claim_push: boolean;
  market_push: boolean;
  rate_alert_push: boolean;
  monetization_push: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  max_push_per_day: number;
}

const DEFAULT_PREFS: Prefs = {
  push_enabled: true, email_enabled: true, sms_enabled: false,
  load_match_push: true, claim_push: true, market_push: true,
  rate_alert_push: true, monetization_push: true,
  quiet_hours_start: null, quiet_hours_end: null, max_push_per_day: 12,
};

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-amber-500' : 'bg-white/15'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[#121212] shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </label>
  );
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/notifications/preferences', {
      headers: { authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.preferences) setPrefs(p => ({ ...p, ...d.preferences }));
      })
      .finally(() => setLoading(false));
  }, []);

  function getToken(): string {
    // Pull from supabase localStorage key
    try {
      const raw = localStorage.getItem(
        Object.keys(localStorage).find(k => k.includes('auth-token')) ?? ''
      );
      return JSON.parse(raw ?? '{}').access_token ?? '';
    } catch { return ''; }
  }

  async function save() {
    setSaving(true);
    await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(prefs),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function set<K extends keyof Prefs>(key: K, val: Prefs[K]) {
    setPrefs(p => ({ ...p, [key]: val }));
  }

  if (loading) return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-12">
      <div className="mx-auto max-w-lg space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      <div className="mx-auto max-w-lg px-4 py-12">
        <button onClick={() => router.back()} className="mb-6 text-sm text-white/40 hover:text-white">← Back</button>
        <h1 className="mb-8 text-2xl font-black">Notification Preferences</h1>

        <div className="space-y-6">
          {/* Channels */}
          <section className="rounded-xl border border-white/8 bg-white/4 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">Channels</p>
            <div className="space-y-4">
              <Toggle checked={prefs.push_enabled} onChange={v => set('push_enabled', v)}
                label="Push notifications" sub="Instant alerts via the Haul Command app" />
              <Toggle checked={prefs.email_enabled} onChange={v => set('email_enabled', v)}
                label="Email notifications" sub="Summaries, receipts, and confirmations" />
              <Toggle checked={prefs.sms_enabled} onChange={v => set('sms_enabled', v)}
                label="SMS alerts" sub="Opt in for emergency / urgent fallback messages only" />
            </div>
          </section>

          {/* Categories */}
          <section className="rounded-xl border border-white/8 bg-white/4 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">Push categories</p>
            <div className="space-y-4">
              <Toggle checked={prefs.load_match_push} onChange={v => set('load_match_push', v)}
                label="Load matches" sub="New loads on your corridors" />
              <Toggle checked={prefs.rate_alert_push} onChange={v => set('rate_alert_push', v)}
                label="Rate alerts" sub="Rate changes on routes you follow" />
              <Toggle checked={prefs.claim_push} onChange={v => set('claim_push', v)}
                label="Claim &amp; profile prompts" sub="Reminders to claim your listing" />
              <Toggle checked={prefs.market_push} onChange={v => set('market_push', v)}
                label="Market activity" sub="Nearby operator and corridor activity" />
              <Toggle checked={prefs.monetization_push} onChange={v => set('monetization_push', v)}
                label="Billing &amp; subscriptions" sub="Payment and data product alerts" />
            </div>
          </section>

          {/* Quiet hours */}
          <section className="rounded-xl border border-white/8 bg-white/4 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/30">Quiet hours (UTC)</p>
            <p className="mb-4 text-xs text-white/30">Push notifications will be held during these hours.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-white/40">Start</label>
                <input type="time" value={prefs.quiet_hours_start ?? ''}
                  onChange={e => set('quiet_hours_start', e.target.value || null)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">End</label>
                <input type="time" value={prefs.quiet_hours_end ?? ''}
                  onChange={e => set('quiet_hours_end', e.target.value || null)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none" />
              </div>
            </div>
          </section>

          {/* Throttle */}
          <section className="rounded-xl border border-white/8 bg-white/4 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/30">Daily push limit</p>
            <p className="mb-3 text-xs text-white/30">Maximum push notifications per day.</p>
            <input type="range" min={3} max={30} step={1} value={prefs.max_push_per_day}
              onChange={e => set('max_push_per_day', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500" />
            <p className="mt-1 text-right text-sm font-bold text-amber-400">{prefs.max_push_per_day}/day</p>
          </section>

          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-white hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {saved ? '✅ Saved!' : saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </main>
  );
}
