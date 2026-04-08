'use client';
/**
 * components/notifications/NotificationPreferences.tsx
 * Haul Command — Notification Preference Center
 *
 * Role-aware toggle UI for managing which events use:
 *   - Push (Firebase FCM)
 *   - Email
 *   - SMS (surgical — high-value events only)
 *
 * Saves to /api/notifications/preferences (Supabase user_notification_prefs table)
 *
 * Steve Jobs standard: one screen, obvious action, no clutter.
 */

import { useState } from 'react';

type Channel = 'push' | 'email' | 'sms';

interface PrefRow {
  eventType: string;
  label: string;
  description: string;
  available: Channel[];
  defaults: Channel[];
}

const OPERATOR_PREFS: PrefRow[] = [
  {
    eventType: 'load.match_found',
    label: 'New Load Matches',
    description: 'Loads posted in your region matching your equipment',
    available: ['push', 'email', 'sms'],
    defaults: ['push', 'sms'],
  },
  {
    eventType: 'assignment.confirmed',
    label: 'Assignment Confirmed',
    description: 'A broker confirmed your assignment',
    available: ['push', 'email', 'sms'],
    defaults: ['push', 'sms'],
  },
  {
    eventType: 'assignment.cancelled_urgent',
    label: 'Urgent Assignment Changes',
    description: 'Last-minute cancellations or route changes',
    available: ['push', 'email', 'sms'],
    defaults: ['push', 'sms'],
  },
  {
    eventType: 'escrow.payment_released',
    label: 'Payment Released',
    description: 'Escrow funds released to your account',
    available: ['push', 'email', 'sms'],
    defaults: ['push', 'email'],
  },
  {
    eventType: 'insurance.expiring_30d',
    label: 'Insurance Expiry Warning',
    description: '30-day and 7-day warnings before insurance lapses',
    available: ['push', 'email'],
    defaults: ['push', 'email'],
  },
  {
    eventType: 'profile.suspended',
    label: 'Account Alerts',
    description: 'Profile suspensions, document issues, security',
    available: ['push', 'email', 'sms'],
    defaults: ['push', 'email', 'sms'],
  },
  {
    eventType: 'bid.won',
    label: 'Bid Accepted',
    description: 'Your bid on a load was accepted',
    available: ['push', 'email'],
    defaults: ['push'],
  },
  {
    eventType: 'claim.verification_required',
    label: 'Verification Reminders',
    description: 'Profile claim and document submission reminders',
    available: ['push', 'email'],
    defaults: ['push'],
  },
];

const CHANNEL_LABELS: Record<Channel, { label: string; icon: string; note?: string }> = {
  push: { label: 'Push', icon: '🔔' },
  email: { label: 'Email', icon: '✉️' },
  sms: { label: 'SMS', icon: '💬', note: 'Surgical — high-value only' },
};

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, Channel[]>>(
    Object.fromEntries(OPERATOR_PREFS.map((p) => [p.eventType, p.defaults]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleChannel = (eventType: string, channel: Channel) => {
    setPrefs((prev) => {
      const current = prev[eventType] ?? [];
      const updated = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel];
      return { ...prev, [eventType]: updated };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      });
      setSaved(true);
    } catch (err) {
      console.error('[NotificationPreferences] save error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Notification Preferences</h2>
        <p className="text-sm text-gray-400 mt-1">
          Control exactly how Haul Command reaches you. Push is free and instant — use SMS only for your highest-stakes events.
        </p>
      </div>

      {/* Channel legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(Object.entries(CHANNEL_LABELS) as [Channel, typeof CHANNEL_LABELS[Channel]][]).map(([ch, info]) => (
          <span key={ch} className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/10">
            <span>{info.icon}</span>
            <span className="font-medium">{info.label}</span>
            {info.note && <span className="text-gray-600">· {info.note}</span>}
          </span>
        ))}
      </div>

      {/* Preference rows */}
      <div className="divide-y divide-white/5 rounded-xl border border-white/10 overflow-hidden">
        {OPERATOR_PREFS.map((row) => (
          <div key={row.eventType} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4 bg-white/2 hover:bg-white/5 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{row.label}</p>
              <p className="text-xs text-gray-500">{row.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {row.available.map((channel) => {
                const active = (prefs[row.eventType] ?? []).includes(channel);
                const info = CHANNEL_LABELS[channel];
                return (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(row.eventType, channel)}
                    aria-pressed={active}
                    title={info.label}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-white/5 border border-white/10 text-gray-500 hover:border-white/20'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span className="hidden sm:inline">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all disabled:opacity-60"
          id="save-notification-prefs-btn"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
        {saved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <span>✓</span> Saved
          </span>
        )}
      </div>
    </div>
  );
}
