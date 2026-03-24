'use client';

/**
 * /inbox — Full messaging hub with All / Offers / Messages / System tabs
 * Real-time via Supabase, role-aware empty states, unread badges
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useRole } from '@/lib/role-context';
import { supabase } from '@/lib/supabase';

type Tab = 'all' | 'offers' | 'messages' | 'system';

interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_at: string;
  last_message_preview: string;
  unreadCount: number;
  otherParticipantIds: string[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export default function InboxPage() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isOperator = role === 'escort_operator' || role === 'both';

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const res = await fetch('/api/messaging/conversations', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }

      // Fetch notifications for System tab
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(notifs || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const unreadNotifs = notifications.filter(n => !n.read_at).length;

  // Filter conversations by tab
  const filteredConversations = conversations; // All tab shows everything
  // Offers and Messages tabs would filter by message_type, but we show all for now

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalUnread },
    { id: 'offers', label: 'Offers', count: 0 },
    { id: 'messages', label: 'Messages', count: totalUnread },
    { id: 'system', label: 'System', count: unreadNotifs },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Inbox</h1>
            {totalUnread > 0 && (
              <p className="text-gray-500 text-xs mt-1">{totalUnread} unread</p>
            )}
          </div>
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="w-10 h-10 bg-accent text-black rounded-xl flex items-center justify-center font-bold text-lg hover:bg-yellow-500 transition-colors"
            title="New message"
          >
            ✏️
          </button>
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 mb-6">
            <h3 className="text-white font-bold text-sm mb-3">New Message</h3>
            <input
              type="text"
              placeholder="Search by name or company…"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50 mb-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <p className="text-gray-500 text-xs">
              Find an operator or broker to start a conversation. Or tap &quot;Message&quot; on any profile in the directory.
            </p>
            <button
              onClick={() => setShowCompose(false)}
              className="mt-3 text-gray-500 text-xs hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Tab Row */}
        <div className="flex gap-1 mb-6 bg-white/[0.02] rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 relative py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-black text-[9px] font-black rounded-full flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'system' ? (
          /* System Tab — Notifications */
          notifications.length === 0 ? (
            <EmptyState isOperator={isOperator} tab="system" onSwitchTab={setActiveTab} />
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                    n.read_at
                      ? 'bg-white/[0.01] border-white/[0.04]'
                      : 'bg-accent/[0.03] border-accent/10'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">
                    {n.type === 'offer_received' ? '💰' : n.type === 'new_message' ? '💬' : '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold">{n.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{n.body}</p>
                  </div>
                  <span className="text-gray-600 text-[10px] flex-shrink-0">{timeAgo(n.created_at)}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Conversations Tabs (All / Offers / Messages) */
          filteredConversations.length === 0 ? (
            <EmptyState isOperator={isOperator} tab={activeTab} onSwitchTab={setActiveTab} />
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/inbox/${conv.id}`}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-accent/20 ${
                    conv.unreadCount > 0
                      ? 'bg-accent/[0.03] border-accent/10'
                      : 'bg-white/[0.02] border-white/[0.04]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center text-gray-400 text-sm font-bold flex-shrink-0">
                    {conv.otherParticipantIds[0]?.slice(-2).toUpperCase() || '??'}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-sm font-bold truncate">
                        User {conv.otherParticipantIds[0]?.slice(-6) || 'Unknown'}
                      </span>
                      <span className="text-gray-600 text-[10px] flex-shrink-0">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{conv.last_message_preview || 'No messages yet'}</p>
                  </div>
                  {/* Unread dot */}
                  {conv.unreadCount > 0 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )
        )}
      </main>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Empty State — Role-aware, with correct button order
// ──────────────────────────────────────────────────────────────

function EmptyState({ isOperator, tab, onSwitchTab }: { isOperator: boolean; tab: Tab; onSwitchTab?: (tab: Tab) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-5">
        {tab === 'system' ? '🔔' : tab === 'offers' ? '💰' : '💬'}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">
        {tab === 'system' ? 'No system alerts yet' : tab === 'offers' ? 'No offers yet' : 'No messages yet'}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mb-8">
        {tab === 'system'
          ? 'System alerts for regulation changes, new corridor activity, and platform updates will appear here.'
          : isOperator
          ? 'Get on the board and start getting messages from brokers who need pilot coverage.'
          : 'Find verified pilots in the directory or post a load to start receiving responses.'}
      </p>

      {/* Buttons ordered by message-generation probability */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isOperator ? (
          <>
            <Link
              href="/loads"
              className="w-full bg-accent text-black px-5 py-3 rounded-xl font-bold text-sm text-center hover:bg-yellow-500 transition-colors"
            >
              Load Board
            </Link>
            <Link
              href="/directory"
              className="w-full bg-white/[0.06] text-white px-5 py-3 rounded-xl font-bold text-sm text-center border border-white/[0.08] hover:border-accent/30 transition-all"
            >
              Browse Directory
            </Link>
            <Link
              href="#system"
              onClick={(e) => { e.preventDefault(); onSwitchTab?.('system'); }}
              className="w-full bg-transparent text-gray-400 px-5 py-3 rounded-xl font-medium text-sm text-center border border-white/[0.04] hover:text-white hover:border-white/[0.08] transition-all"
            >
              System Alerts
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/loads"
              className="w-full bg-accent text-black px-5 py-3 rounded-xl font-bold text-sm text-center hover:bg-yellow-500 transition-colors"
            >
              Post a Load
            </Link>
            <Link
              href="/directory"
              className="w-full bg-white/[0.06] text-white px-5 py-3 rounded-xl font-bold text-sm text-center border border-white/[0.08] hover:border-accent/30 transition-all"
            >
              Browse Operators
            </Link>
            <Link
              href="#system"
              onClick={(e) => { e.preventDefault(); }}
              className="w-full bg-transparent text-gray-400 px-5 py-3 rounded-xl font-medium text-sm text-center border border-white/[0.04] hover:text-white hover:border-white/[0.08] transition-all"
            >
              System Alerts
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
