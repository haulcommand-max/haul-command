// components/offline/ConnectionStatusBar.tsx
// ═══════════════════════════════════════════════════════════════
// Connection status indicator for mobile app nav
// Green: Connected | Yellow: Weak | Red: Offline + pending sync count
// ═══════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect } from 'react';

export default function ConnectionStatusBar() {
  const [status, setStatus] = useState<'online' | 'slow' | 'offline'>('online');
  const [pendingCount, setPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateStatus() {
      if (!navigator.onLine) {
        setStatus('offline');
        setVisible(true);
      } else {
        setStatus('online');
        // Auto-hide after 3 seconds when back online
        setTimeout(() => setVisible(false), 3000);
      }
    }

    async function checkPending() {
      try {
        const { getPendingCount } = await import('@/lib/offline/queue');
        const count = await getPendingCount();
        setPendingCount(count);
        if (count > 0) setVisible(true);
      } catch {}
    }

    updateStatus();
    checkPending();

    window.addEventListener('online', () => {
      setStatus('online');
      setVisible(true);
      // Replay queue
      import('@/lib/offline/queue').then(m => m.replayQueue()).then(() => checkPending());
    });
    window.addEventListener('offline', () => {
      setStatus('offline');
      setVisible(true);
    });

    const interval = setInterval(checkPending, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!visible && status === 'online' && pendingCount === 0) return null;

  const colors = {
    online: { bg: '#22c55e20', border: '#22c55e40', text: '#22c55e', label: 'Connected' },
    slow: { bg: '#eab30820', border: '#eab30840', text: '#eab308', label: 'Weak Connection' },
    offline: { bg: '#ef444420', border: '#ef444440', text: '#ef4444', label: 'Offline' },
  };
  const c = colors[status];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 16px',
        background: c.bg,
        borderTop: `1px solid ${c.border}`,
        backdropFilter: 'blur(8px)',
        fontSize: 12,
        fontWeight: 600,
        color: c.text,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: c.text,
          animation: status === 'offline' ? 'pulse 1.5s infinite' : 'none',
        }}
      />
      <span>{c.label}</span>
      {pendingCount > 0 && (
        <span style={{
          padding: '1px 6px',
          borderRadius: 10,
          background: '#eab30830',
          color: '#eab308',
          fontSize: 10,
          fontWeight: 700,
          animation: 'pulse 2s infinite',
        }}>
          {pendingCount} pending sync
        </span>
      )}
      {status === 'offline' && (
        <span style={{ fontSize: 10, color: '#8b949e' }}>Core features available</span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
