'use client';

// components/feed/LiveActivityFeed.tsx
// Shows real-time platform activity from /api/activity/feed.
// Displays claims, certifications, availability broadcasts, dispatches.
// 60s auto-refresh. Graceful empty state.

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: string;
  title: string;
  detail: string;
  ts: string;
  icon: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  claim: '#22c55e',
  certification: '#C6923A',
  availability: '#3b82f6',
  dispatch: '#a855f7',
};

export function LiveActivityFeed({ maxItems = 8 }: { maxItems?: number }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchFeed() {
      try {
        const res = await fetch('/api/activity/feed');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data.events) {
          setEvents(data.events.slice(0, maxItems));
        }
      } catch { /* network error */ }
      if (mounted) setLoading(false);
    }

    fetchFeed();
    const interval = setInterval(fetchFeed, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [maxItems]);

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity style={{ width: 14, height: 14, color: '#475569' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>Loading feed...</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.03)', marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '24px 20px', textAlign: 'center',
      }}>
        <Activity style={{ width: 20, height: 20, color: '#334155', margin: '0 auto 8px' }} />
        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Activity feed warming up...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.5)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>
            Live Activity
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#334155' }}>{events.length} events</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {events.map((e, i) => (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '8px 0',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${TYPE_COLORS[e.type] || '#475569'}15`, fontSize: 10, flexShrink: 0, marginTop: 2,
            }}>
              {e.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.3 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail}</div>
            </div>
            <span style={{ fontSize: 10, color: '#334155', flexShrink: 0, marginTop: 2 }}>{timeAgo(e.ts)}</span>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}
