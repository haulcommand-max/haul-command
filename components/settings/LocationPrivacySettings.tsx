// components/settings/LocationPrivacySettings.tsx
// Privacy controls for operator location sharing

'use client';

import { useState } from 'react';

interface Props {
  initialEnabled: boolean;
  operatorId: string;
}

export default function LocationPrivacySettings({ initialEnabled, operatorId }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch('/api/location/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: operatorId,
          location_sharing_enabled: !enabled,
        }),
      });
      if (res.ok) setEnabled(!enabled);
    } catch {}
    setSaving(false);
  }

  return (
    <div style={{
      background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24,
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#e0e0e6' }}>📍 Location Privacy</h3>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: '#0d1117', borderRadius: 8, marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#e0e0e6' }}>Share Live Location</div>
          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
            Brokers can see your position when you're available
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none',
            background: enabled ? '#22c55e' : '#30363d',
            cursor: saving ? 'not-allowed' : 'pointer',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: enabled ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#8b949e', lineHeight: 1.6 }}>
        <h4 style={{ margin: '0 0 8px', color: '#c9d1d9', fontSize: 13 }}>What data is shared:</h4>
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          <li>Approximate location (county-level for public, exact for authenticated brokers)</li>
          <li>Speed and heading when moving</li>
          <li>ELD/Motive data if connected</li>
        </ul>

        <h4 style={{ margin: '16px 0 8px', color: '#c9d1d9', fontSize: 13 }}>Privacy guarantees:</h4>
        <ul style={{ paddingLeft: 16, margin: 0 }}>
          <li>Location data auto-expires after 5 minutes of no update</li>
          <li>Location data never stored longer than 24 hours</li>
          <li>Public map shows approximate county-level only</li>
          <li>Only authenticated users see precise location</li>
          <li>You can disable sharing without changing availability</li>
        </ul>
      </div>
    </div>
  );
}
