'use client';

import { useEffect, useState } from 'react';

/**
 * Connection status indicator bar for mobile app.
 * Green = Connected, Yellow = Weak, Red = Offline.
 * Shows pending sync count.
 */
export function ConnectionStatusBar() {
  const [status, setStatus] = useState<'online' | 'weak' | 'offline'>('online');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const check = () => {
      if (!navigator.onLine) { setStatus('offline'); return; }
      // Check connection quality if available
      const conn = (navigator as any).connection;
      if (conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) {
        setStatus('weak');
      } else {
        setStatus('online');
      }
    };

    const updateCount = async () => {
      try {
        const { offlineQueue } = await import('@/lib/offline/queue');
        const count = await offlineQueue.count();
        setPendingCount(count);
      } catch { setPendingCount(0); }
    };

    check();
    updateCount();
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    const id = setInterval(updateCount, 5000);

    return () => {
      window.removeEventListener('online', check);
      window.removeEventListener('offline', check);
      clearInterval(id);
    };
  }, []);

  if (status === 'online' && pendingCount === 0) return null;

  const styles = {
    online: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Connected' },
    weak: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Weak connection' },
    offline: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Offline — core features available' },
  };
  const s = styles[status];

  return (
    <div className={`${s.bg} ${s.text} px-4 py-2 flex items-center justify-between text-xs font-medium`}>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${s.dot} ${status === 'offline' ? '' : 'animate-pulse'}`} />
        {s.label}
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          {pendingCount} item{pendingCount !== 1 ? 's' : ''} pending sync
        </div>
      )}
    </div>
  );
}
