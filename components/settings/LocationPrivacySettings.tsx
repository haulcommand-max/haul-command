'use client';

/**
 * Location privacy settings panel for operators.
 * Shows exactly what GPS data is being shared and provides controls.
 */
import { useState } from 'react';

export function LocationPrivacySettings({ operatorId, initialEnabled = true }: {
  operatorId: string;
  initialEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/location-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: operatorId, enabled: !enabled }),
      });
      if (res.ok) setEnabled(!enabled);
    } catch { /* offline */ }
    setSaving(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 space-y-4">
      <h3 className="text-white font-semibold text-lg flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Location Sharing
      </h3>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-medium">Share precise location</p>
          <p className="text-gray-500 text-xs">Brokers see your exact position on the map</p>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 ${enabled ? 'left-6' : 'left-0.5'} w-5 h-5 bg-white rounded-full transition-all shadow`} />
        </button>
      </div>

      {/* What's shared */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Data being shared</p>
        <DataRow label="GPS coordinates" shared={enabled} />
        <DataRow label="Direction of travel" shared={enabled} />
        <DataRow label="Speed" shared={enabled} />
        <DataRow label="County-level location" shared={true} note="(always visible to public)" />
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
        <p className="text-blue-400 text-xs">
          🔒 Location data is never stored longer than 24 hours. Non-authenticated users see county-level only.
        </p>
      </div>
    </div>
  );
}

function DataRow({ label, shared, note }: { label: string; shared: boolean; note?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-1.5 h-1.5 rounded-full ${shared ? 'bg-emerald-400' : 'bg-gray-600'}`} />
      <span className={shared ? 'text-white' : 'text-gray-600'}>{label}</span>
      {note && <span className="text-gray-600 text-xs">{note}</span>}
    </div>
  );
}
