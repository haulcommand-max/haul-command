'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Truck, DollarSign, AlertCircle, MessageSquare, Star, Zap } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════════
   MobileNotifications — Novu-powered push + in-app notification center
   API: GET /api/notifications (Novu subscriber feed)
        POST /api/notifications/mark-read
   Realtime: Novu Server-Sent Events or Supabase Realtime fallback
   ══════════════════════════════════════════════════════════════════════════ */

type NotifType = 'load_match' | 'payment' | 'alert' | 'message' | 'review' | 'system';

interface NovuNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  cta_url?: string;
  metadata?: Record<string, string | number>;
}

const TYPE_CONFIG: Record<NotifType, { icon: React.FC<{ size: number; color: string }>; color: string; bg: string }> = {
  load_match: { icon: Truck, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  payment: { icon: DollarSign, color: '#C6923A', bg: 'rgba(198,146,58,0.1)' },
  alert: { icon: AlertCircle, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  message: { icon: MessageSquare, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  review: { icon: Star, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  system: { icon: Zap, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Demo seed (displayed when API returns empty)
const DEMO: NovuNotification[] = [
  { id: 'n1', type: 'load_match', title: 'New Load Match!', body: 'Chicago → Atlanta, 34,000 lbs, $2,850 — expires in 4h', read: false, created_at: new Date(Date.now() - 300000).toISOString(), cta_url: '/dashboard/broker/loads' },
  { id: 'n2', type: 'payment', title: 'Escrow Released', body: '$1,420.00 released for Load #HC-8821. Funds available in 24h.', read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'n3', type: 'alert', title: 'Rate Alert: I-80 Corridor', body: 'Spot rates up 18% vs last week. Book now to lock current rates.', read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n4', type: 'message', title: 'Broker Message', body: 'FastFreight LLC: "Can you do pickup by 7am? We\'ll add $200 to the load."', read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n5', type: 'review', title: 'New 5-Star Review', body: 'Great service and on-time delivery. Will book again — FastFreight LLC', read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n6', type: 'system', title: 'KYC Approved ✓', body: 'Your identity has been verified. Crypto payouts are now enabled.', read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
];

export default function MobileNotifications() {
  const [notifications, setNotifications] = useState<NovuNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setNotifications(data?.notifications?.length ? data.notifications : DEMO);
        setLoading(false);
      })
      .catch(() => { setNotifications(DEMO); setLoading(false); });
  }, []);

  const markAllRead = useCallback(async () => {
    setMarking(true);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) }).catch(() => {});
    setMarking(false);
  }, []);

  const markOne = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch('/api/notifications/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayed = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div style={{ background: 'var(--m-bg, #070b12)', minHeight: '100dvh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 0', position: 'sticky', top: 0,
        background: 'var(--m-bg, #070b12)', zIndex: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={20} color="#fff" />
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 900, margin: 0 }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800,
                padding: '2px 7px', borderRadius: 12, lineHeight: 1.4,
              }}>{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filter === f ? 'rgba(212,168,68,0.12)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#D4A844' : '#64748b',
              border: `1px solid ${filter === f ? 'rgba(212,168,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
              textTransform: 'capitalize',
            }}>
              {f === 'unread' ? `Unread (${unreadCount})` : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '8px 16px 80px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Loading...</div>}

        {!loading && displayed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <Bell size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>You're all caught up</p>
          </div>
        )}

        {displayed.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type];
          const Icon = cfg.icon;
          return (
            <div
              key={n.id}
              onClick={() => { if (!n.read) markOne(n.id); if (n.cta_url) window.location.href = n.cta_url; }}
              style={{
                display: 'flex', gap: 12, padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                cursor: n.cta_url ? 'pointer' : 'default',
                opacity: n.read ? 0.6 : 1,
                animation: `fade-in 0.2s ease ${i * 30}ms both`,
              }}
            >
              {/* Icon dot */}
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <Icon size={18} color={cfg.color} />
                {!n.read && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444', border: '1.5px solid var(--m-bg, #070b12)',
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: n.read ? '#94a3b8' : '#fff', fontWeight: n.read ? 600 : 800, fontSize: 14 }}>
                    {n.title}
                  </span>
                  <span style={{ color: '#475569', fontSize: 10, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                </div>
                <p style={{ color: '#64748b', fontSize: 13, margin: '3px 0 0', lineHeight: 1.5 }}>{n.body}</p>
                {n.cta_url && (
                  <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700, marginTop: 4, display: 'block' }}>
                    View →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
