'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Bell,
  Zap,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
  Truck,
  AlertTriangle,
} from 'lucide-react';

// ─── Supabase realtime client ────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface DispatchAlert {
  id: string;
  type: 'LOAD_MATCH' | 'BID_ACCEPTED' | 'BID_REJECTED' | 'PAYMENT_READY' | 'COMPLIANCE';
  title: string;
  body: string;
  payload?: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

interface BidState {
  alertId: string;
  loadId: string;
  submitting: boolean;
  bidAmount: string;
  submitted: boolean;
  origin?: string;
  destination?: string;
  rate?: number;
}

const TYPE_STYLES: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  LOAD_MATCH:     { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  icon: <Truck size={14} /> },
  BID_ACCEPTED:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  icon: <CheckCircle2 size={14} /> },
  BID_REJECTED:   { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: <XCircle size={14} /> },
  PAYMENT_READY:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  icon: <DollarSign size={14} /> },
  COMPLIANCE:     { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.2)',  icon: <AlertTriangle size={14} /> },
};

function relativeTime(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Bid Panel ────────────────────────────────────────────────────────────────
function BidPanel({ bid, onClose }: { bid: BidState; onClose: () => void }) {
  const [amount, setAmount] = useState(bid.bidAmount || String(bid.rate || ''));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    try {
      await fetch('/api/dispatch/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: bid.loadId, bid_amount: parseFloat(amount) }),
      });
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e) {
      console.error('Bid failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 16, padding: 18, marginTop: 12 }}>
      {done ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#34d399', fontWeight: 700, fontSize: 14 }}>
          <CheckCircle2 size={18} /> Bid submitted! Waiting for broker response.
        </div>
      ) : (
        <>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#e2e8f0' }}>{bid.origin}</strong> → <strong style={{ color: '#e2e8f0' }}>{bid.destination}</strong>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0 12px', gap: 6 }}>
              <DollarSign size={14} color="#64748b" />
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Your bid (USD)"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 15, fontWeight: 700, padding: '11px 0' }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !amount}
              style={{ padding: '0 20px', background: 'linear-gradient(135deg, #34d399, #059669)', border: 'none', borderRadius: 10, color: '#000', fontWeight: 800, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {submitting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {submitting ? 'Sending...' : 'Submit Bid'}
            </button>
            <button
              onClick={onClose}
              style={{ padding: '0 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#64748b', cursor: 'pointer', fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, onMarkRead, onBidOpen, activeBid }: {
  alert: DispatchAlert;
  onMarkRead: (id: string) => void;
  onBidOpen: (alert: DispatchAlert) => void;
  activeBid: BidState | null;
}) {
  const style = TYPE_STYLES[alert.type] ?? TYPE_STYLES.LOAD_MATCH;
  const isNew = !alert.read_at;
  const isBidOpen = activeBid?.alertId === alert.id;

  return (
    <div
      style={{
        background: isNew ? style.bg : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isNew ? style.border : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: '16px 18px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => !alert.read_at && onMarkRead(alert.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: style.bg, border: `1px solid ${style.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: style.color, flexShrink: 0 }}>
          {style.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: isNew ? 700 : 600, color: isNew ? '#f1f5f9' : '#94a3b8' }}>
              {alert.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {isNew && <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.color }} />}
              <span style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>{relativeTime(alert.created_at)}</span>
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{alert.body}</p>

          {/* Load-match actions */}
          {alert.type === 'LOAD_MATCH' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={e => { e.stopPropagation(); onBidOpen(alert); }}
                style={{ padding: '7px 14px', background: `linear-gradient(135deg, ${style.color}, #059669)`, border: 'none', borderRadius: 9, color: '#000', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
              >
                ⚡ Place Bid
              </button>
              <a
                href={`/loads/${alert.payload?.load_id}`}
                onClick={e => e.stopPropagation()}
                style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: '#94a3b8', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
              >
                View Load
              </a>
            </div>
          )}
          {alert.type === 'BID_ACCEPTED' && (
            <a
              href={`/loads/${alert.payload?.load_id}`}
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-block', marginTop: 10, padding: '7px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 9, color: '#60a5fa', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
            >
              🔒 Fund Escrow Now →
            </a>
          )}
        </div>
      </div>
      {isBidOpen && <BidPanel bid={activeBid!} onClose={() => onBidOpen(alert)} />}
    </div>
  );
}

// ─── Main Notification Center ─────────────────────────────────────────────────
interface Props {
  userId: string;
  /** If provided, render as inline panel. Otherwise renders as floating bell. */
  inline?: boolean;
}

export function DispatchNotificationCenter({ userId, inline = false }: Props) {
  const [alerts, setAlerts] = useState<DispatchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(inline);
  const [activeBid, setActiveBid] = useState<BidState | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const unread = alerts.filter(a => !a.read_at).length;

  // Load initial alerts
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('notification_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setAlerts(data as DispatchAlert[]);
      setLoading(false);
    };
    load();

    // Realtime subscription
    const channel = supabase
      .channel(`dispatch-inbox-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_events', filter: `user_id=eq.${userId}` }, payload => {
        setAlerts(prev => [payload.new as DispatchAlert, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read_at: new Date().toISOString() } : a));
    await supabase.from('notification_events').update({ read_at: new Date().toISOString() }).eq('id', id);
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setAlerts(prev => prev.map(a => ({ ...a, read_at: a.read_at ?? now })));
    await supabase.from('notification_events').update({ read_at: now }).eq('user_id', userId).is('read_at', null);
  };

  const handleBidOpen = (alert: DispatchAlert) => {
    if (activeBid?.alertId === alert.id) { setActiveBid(null); return; }
    setActiveBid({
      alertId: alert.id,
      loadId: alert.payload?.load_id ?? '',
      submitting: false,
      bidAmount: '',
      submitted: false,
      origin: alert.payload?.origin_city ? `${alert.payload.origin_city}, ${alert.payload.origin_state}` : 'Origin',
      destination: alert.payload?.destination_city ? `${alert.payload.destination_city}, ${alert.payload.destination_state}` : 'Destination',
      rate: alert.payload?.posted_rate,
    });
  };

  const panel = (
    <div style={{ background: 'linear-gradient(160deg, #0a0f1a, #060810)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: inline ? 20 : 20, width: inline ? '100%' : 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: inline ? 'none' : '0 30px 80px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={16} color="#fbbf24" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>Dispatch Inbox</span>
          {unread > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 20, padding: '2px 7px' }}>{unread}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}>
              Mark all read
            </button>
          )}
          {!inline && (
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 size={24} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569' }}>
            <Bell size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>No dispatch alerts yet.</p>
            <p style={{ margin: '6px 0 0', fontSize: 12 }}>Load matches, bids and payments will appear here.</p>
          </div>
        )}
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onMarkRead={markRead}
            onBidOpen={handleBidOpen}
            activeBid={activeBid?.alertId === alert.id ? activeBid : null}
          />
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (inline) return panel;

  return (
    <div ref={bellRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        id="dispatch-notification-bell"
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', width: 42, height: 42, borderRadius: 12, background: open ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${open ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.09)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
      >
        <Bell size={18} color={open ? '#fbbf24' : '#94a3b8'} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid #060810' }} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 1000 }}>
          {panel}
        </div>
      )}
    </div>
  );
}
