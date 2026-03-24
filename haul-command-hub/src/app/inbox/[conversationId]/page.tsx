'use client';

/**
 * /inbox/[conversationId] — Full conversation view
 * Offer cards with Accept/Decline/Counter, real-time messages,
 * quick replies, typing indicator, load card pinned header
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { use } from 'react';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  offer_data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCounterModal, setShowCounterModal] = useState<string | null>(null);
  const [counterRate, setCounterRate] = useState('');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/messaging/messages/${conversationId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      setCurrentUserId(data.currentUserId);
    }
    setLoading(false);
  }, [conversationId]);

  // Mark as read on mount
  useEffect(() => {
    const markRead = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch('/api/messaging/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversationId }),
      });
    };
    markRead();
    fetchMessages();
  }, [conversationId, fetchMessages]);

  // Supabase realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/messaging/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          conversationId,
          body: newMessage.trim(),
          messageType: 'text',
        }),
      });

      setNewMessage('');
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleRespondOffer = async (messageId: string, action: 'accept' | 'decline' | 'counter', rate?: number) => {
    setRespondingTo(messageId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch('/api/messaging/respond-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messageId, action, counterRate: rate }),
      });

      setShowCounterModal(null);
      setCounterRate('');
      fetchMessages();
    } catch (err) {
      console.error('Respond error:', err);
    } finally {
      setRespondingTo(null);
    }
  };

  const handleQuickReply = (text: string) => {
    setNewMessage(text);
  };

  const timeStr = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine quick reply chips based on last message
  const lastMsg = messages[messages.length - 1];
  const quickReplies = lastMsg?.message_type === 'offer' && lastMsg?.sender_id !== currentUserId
    ? ["I'm available", "What's the start time?", "Decline"]
    : lastMsg?.message_type === 'acceptance'
    ? ["Payment confirmed", "Great working with you", "Let's do it again"]
    : [];

  return (
    <>
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-black/90 backdrop-blur-md z-10">
          <Link href="/inbox" className="text-gray-400 hover:text-white transition-colors text-lg">
            ←
          </Link>
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">Conversation</p>
            <p className="text-gray-500 text-[10px]">{messages.length} messages · Online</p>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors text-sm">ℹ️</button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-center">
              <div>
                <div className="text-4xl mb-4">💬</div>
                <p className="text-gray-500 text-sm">Start the conversation</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              const isOffer = msg.message_type === 'offer' || msg.message_type === 'counter_offer';
              const isSystem = msg.message_type === 'system' || msg.message_type === 'acceptance' || msg.message_type === 'decline';

              // System messages
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-1.5 text-gray-500 text-xs text-center">
                      {msg.message_type === 'acceptance' && '✅ '}
                      {msg.message_type === 'decline' && '❌ '}
                      {msg.body}
                    </div>
                  </div>
                );
              }

              // Offer cards
              if (isOffer && msg.offer_data) {
                const od = msg.offer_data as Record<string, unknown>;
                const expired = od.expires_at && new Date(od.expires_at as string) < new Date();
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl overflow-hidden border ${
                      isMine ? 'border-accent/30 bg-accent/5' : 'border-blue-500/30 bg-blue-500/5'
                    }`}>
                      {/* Offer Header */}
                      <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider ${
                        isMine ? 'bg-accent/10 text-accent' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {msg.message_type === 'counter_offer' ? '↩️ COUNTER OFFER' : '💰 LOAD OFFER'}
                      </div>

                      {/* Offer Body */}
                      <div className="px-4 py-3 space-y-2">
                        {od.corridor ? (
                          <div className="text-white text-sm font-bold">{String(od.corridor)}</div>
                        ) : null}
                        <div className="flex items-center gap-4">
                          {od.rate_per_day ? (
                            <div>
                              <div className="text-accent font-black text-2xl">${String(od.rate_per_day)}</div>
                              <div className="text-gray-500 text-[10px]">per day</div>
                            </div>
                          ) : null}
                          {od.load_type ? (
                            <div>
                              <div className="text-white text-sm capitalize">{String(od.load_type).replace(/_/g, ' ')}</div>
                              <div className="text-gray-500 text-[10px]">load type</div>
                            </div>
                          ) : null}
                        </div>
                        {od.start_date ? (
                          <div className="text-gray-400 text-xs">Start: {String(od.start_date)}</div>
                        ) : null}
                        {od.notes ? (
                          <div className="text-gray-400 text-xs italic">{String(od.notes)}</div>
                        ) : null}
                        {expired ? (
                          <div className="text-red-400 text-xs font-bold">⏰ Expired</div>
                        ) : null}
                      </div>

                      {/* Action Buttons (only for received offers) */}
                      {!isMine && !expired && (
                        <div className="px-4 py-3 border-t border-white/[0.06] flex gap-2">
                          <button
                            onClick={() => handleRespondOffer(msg.id, 'accept')}
                            disabled={respondingTo === msg.id}
                            className="flex-1 bg-accent text-black py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50"
                          >
                            {respondingTo === msg.id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => { setShowCounterModal(msg.id); setCounterRate(''); }}
                            className="flex-1 bg-white/[0.06] text-white py-2 rounded-lg text-xs font-bold border border-white/[0.1] hover:border-accent/30 transition-all"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleRespondOffer(msg.id, 'decline')}
                            disabled={respondingTo === msg.id}
                            className="flex-1 bg-red-500/10 text-red-400 py-2 rounded-lg text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      <div className={`px-4 py-1.5 text-[10px] ${isMine ? 'text-accent/50' : 'text-gray-600'}`}>
                        {timeStr(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular messages
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-accent text-black rounded-br-md'
                        : 'bg-white/[0.06] text-white rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-black/50' : 'text-gray-500'}`}>
                      {timeStr(msg.created_at)}
                      {isMine && msg.read_at && ' · ✓✓'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Counter Offer Modal */}
        {showCounterModal && (
          <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-white font-bold text-lg mb-4">Counter Offer</h3>
              <label className="text-gray-400 text-xs block mb-2">Your rate per day ($)</label>
              <input
                type="number"
                value={counterRate}
                onChange={(e) => setCounterRate(e.target.value)}
                placeholder="e.g. 400"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg font-bold placeholder:text-gray-600 focus:outline-none focus:border-accent/50 mb-4 tabular-nums"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCounterModal(null)}
                  className="flex-1 bg-white/[0.06] text-gray-400 py-3 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => counterRate && handleRespondOffer(showCounterModal, 'counter', Number(counterRate))}
                  disabled={!counterRate || Number(counterRate) < 1}
                  className="flex-1 bg-accent text-black py-3 rounded-xl text-sm font-bold disabled:opacity-30"
                >
                  Send Counter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Reply Chips */}
        {quickReplies.length > 0 && (
          <div className="flex gap-2 px-4 py-2 overflow-x-auto border-t border-white/[0.04]">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => handleQuickReply(qr)}
                className="flex-shrink-0 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5 text-xs text-gray-300 hover:border-accent/30 hover:text-accent transition-all"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-black/90 backdrop-blur-md">
          <input
            type="text"
            placeholder="Type a message…"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/40"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-accent text-black rounded-xl flex items-center justify-center font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
          >
            {sending ? '…' : '→'}
          </button>
        </div>
      </div>
    </>
  );
}
