'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DispatchNotification {
  id: string;
  type: 'load:new' | 'load:matched' | 'load:accepted' | 'dispatch:alert' | 'surge:updated' | 'offer:received';
  title: string;
  body: string;
  payload: Record<string, any>;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NovuNotificationCenterProps {
  subscriberId: string;
  onNotificationClick?: (notification: DispatchNotification) => void;
  compact?: boolean;
}

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  'load:new':      { emoji: '📦', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'load:matched':  { emoji: '🎯', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  'load:accepted': { emoji: '✅', color: '#00c864', bg: 'rgba(0,200,100,0.1)' },
  'dispatch:alert':{ emoji: '⚡', color: '#ff8c00', bg: 'rgba(255,140,0,0.1)' },
  'surge:updated': { emoji: '📈', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'offer:received':{ emoji: '💰', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NovuNotificationCenter({
  subscriberId,
  onNotificationClick,
  compact = false,
}: NovuNotificationCenterProps) {
  const [notifications, setNotifications] = useState<DispatchNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial notifications from Novu via backend proxy
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?subscriberId=${subscriberId}&limit=30`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n: DispatchNotification) => !n.read).length);
    } catch (err) {
      console.error('[NovuNotifCenter] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [subscriberId]);

  // Connect to SSE dispatch event stream for real-time push
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;

    const es = new EventSource('/api/dispatch/realtime');
    eventSourceRef.current = es;

    es.addEventListener('load:new', (e) => {
      const data = JSON.parse(e.data);
      const notif: DispatchNotification = {
        id: data.eventId,
        type: 'load:new',
        title: '📦 New Load Posted',
        body: `${data.payload.origin || 'Unknown'} → ${data.payload.destination || 'Unknown'}`,
        payload: data.payload,
        read: false,
        createdAt: data.timestamp,
        actionUrl: data.payload.load_id ? `/loads/${data.payload.load_id}` : '/loads',
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });

    es.addEventListener('load:matched', (e) => {
      const data = JSON.parse(e.data);
      const notif: DispatchNotification = {
        id: data.eventId,
        type: 'load:matched',
        title: '🎯 You Were Matched!',
        body: `A broker selected you for a load in ${data.payload.region_code || 'your area'}.`,
        payload: data.payload,
        read: false,
        createdAt: data.timestamp,
        actionUrl: '/dispatch',
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });

    es.addEventListener('surge:updated', (e) => {
      const data = JSON.parse(e.data);
      const notif: DispatchNotification = {
        id: data.eventId,
        type: 'surge:updated',
        title: '📈 Surge Pricing Active',
        body: `${data.payload.region_code}: ${data.payload.multiplier}x multiplier`,
        payload: data.payload,
        read: false,
        createdAt: data.timestamp,
        actionUrl: '/market',
      };
      setNotifications(prev => [notif, ...prev].slice(0, 50));
      setUnreadCount(c => c + 1);
    });

    es.onerror = () => {
      es.close();
      // Reconnect after 5s
      setTimeout(connectSSE, 5000);
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
    connectSSE();
    return () => eventSourceRef.current?.close();
  }, [fetchNotifications, connectSSE]);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriberId }),
      });
    } catch {}
  }, [subscriberId]);

  const handleClick = useCallback((notif: DispatchNotification) => {
    if (!notif.read) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
      );
      setUnreadCount(c => Math.max(0, c - 1));
    }
    setIsOpen(false);
    onNotificationClick?.(notif);
    if (notif.actionUrl) window.location.href = notif.actionUrl;
  }, [onNotificationClick]);

  // Compact bell icon mode for bottom nav embedding
  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '8px',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span style={{ fontSize: '24px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#ff3333', color: '#fff',
            borderRadius: '50%', fontSize: '10px', fontWeight: 700,
            minWidth: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d1a 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{ color: '#888', fontSize: '13px' }}>{unreadCount} unread</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'none', border: 'none', color: '#ff8c00',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Real-time indicator */}
      <div style={{
        margin: '0 16px 16px',
        padding: '8px 14px',
        background: 'rgba(0,200,100,0.06)',
        border: '1px solid rgba(0,200,100,0.2)',
        borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', background: '#00c864',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <span style={{ color: '#00c864', fontSize: '12px', fontWeight: 500 }}>
          Live dispatch stream connected
        </span>
      </div>

      {/* Notifications List */}
      <div style={{ padding: '0 16px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
            Loading notifications...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            color: '#555', fontSize: '15px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔕</div>
            No notifications yet. New loads and matches will appear here in real time.
          </div>
        )}

        {notifications.map(notif => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG['dispatch:alert'];
          return (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              style={{
                width: '100%', textAlign: 'left',
                background: notif.read ? 'rgba(255,255,255,0.02)' : cfg.bg,
                border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : cfg.color + '33'}`,
                borderRadius: '14px', padding: '14px',
                marginBottom: '10px', cursor: 'pointer',
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: cfg.bg, border: `1px solid ${cfg.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', flexShrink: 0,
              }}>
                {cfg.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: notif.read ? '#888' : '#fff',
                  fontWeight: notif.read ? 500 : 700,
                  fontSize: '14px', marginBottom: '4px',
                }}>
                  {notif.title}
                </div>
                <div style={{ color: '#666', fontSize: '13px', lineHeight: '1.4', marginBottom: '6px' }}>
                  {notif.body}
                </div>
                <div style={{ color: '#444', fontSize: '11px' }}>
                  {timeAgo(notif.createdAt)}
                </div>
              </div>
              {!notif.read && (
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: cfg.color, flexShrink: 0, marginTop: '6px',
                }} />
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
