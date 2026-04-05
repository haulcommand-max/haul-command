'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';

interface NotifRow {
  id: string;
  event_type: string;
  title: string;
  body: string;
  deep_link: string | null;
  status: string;
  created_at: string;
}

const EVENT_ICONS: Record<string, string> = {
  new_load_match: '📍',
  urgent_nearby_work: '⚡',
  repositioning_opportunity: '🚛',
  operator_match_found: '✅',
  coverage_gap_alert: '⚠️',
  urgent_replacement_needed: '🚨',
  claim_reminder: '🏷️',
  claim_approved: '✅',
  profile_incomplete: '📊',
  profile_benefit_unlocked: '🌟',
  trust_score_changed: '🛡️',
  payment_confirmed: '💳',
  payment_failed: '⚠️',
  data_product_expiring: '⏳',
  saved_corridor_update: '🛣️',
  nearby_market_active: '📍',
  leaderboard_rank_change: '🏆',
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

export function NotificationBell() {
  const supabase = createClientComponentClient();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications for current user
  async function loadNotifs() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from('hc_notif_events')
      .select('id,event_type,title,body,deep_link,status,created_at')
      .eq('user_id', session.user.id)
      .eq('channel', 'push')
      .order('created_at', { ascending: false })
      .limit(30);

    const rows = (data ?? []) as NotifRow[];
    setNotifs(rows);
    setUnread(rows.filter(r => r.status === 'sent' || r.status === 'delivered').length);
    setLoading(false);
  }

  // Mark visible as opened
  async function markOpened(ids: string[]) {
    if (!ids.length) return;
    await supabase
      .from('hc_notif_events')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .in('id', ids)
      .in('status', ['sent', 'delivered']);
    setUnread(0);
    setNotifs(prev => prev.map(n => ids.includes(n.id) ? { ...n, status: 'opened' } : n));
  }

  // Subscribe to real-time new notifications
  useEffect(() => {
    loadNotifs();

    const channel = supabase
      .channel('notif_events_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'hc_notif_events',
        filter: `channel=eq.push`,
      }, (payload: any) => {
        setNotifs(prev => [payload.new as NotifRow, ...prev].slice(0, 30));
        setUnread(u => u + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleOpen() {
    setOpen(o => !o);
    if (!open) {
      const unreadIds = notifs.filter(n => n.status === 'sent' || n.status === 'delivered').map(n => n.id);
      markOpened(unreadIds);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10 transition-all"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-black">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1420] shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="text-sm font-bold text-white">Notifications</span>
            <Link
              href="/notifications"
              className="text-xs text-amber-400 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />)}
              </div>
            ) : notifs.length === 0 ? (
              <div className="p-6 text-center text-sm text-white/40">
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <NotifItem key={n.id} notif={n} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 px-4 py-2">
            <Link
              href="/notifications/preferences"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
              onClick={() => setOpen(false)}
            >
              Manage preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ notif, onClose }: { notif: NotifRow; onClose: () => void }) {
  const icon = EVENT_ICONS[notif.event_type] ?? '🔔';
  const isUnread = notif.status === 'sent' || notif.status === 'delivered';

  const content = (
    <div className={`flex gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
      isUnread ? 'bg-amber-500/5' : ''
    }`}>
      <span className="mt-0.5 shrink-0 text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-tight ${
          isUnread ? 'text-white' : 'text-white/70'
        }`}>
          {notif.title}
          {isUnread && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-500 align-middle" />}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-white/40">{notif.body}</p>
        <p className="mt-1 text-[10px] text-white/25">{timeAgo(notif.created_at)}</p>
      </div>
    </div>
  );

  if (notif.deep_link) {
    return (
      <Link href={notif.deep_link} onClick={onClose} className="block">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default NotificationBell;
