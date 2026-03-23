'use client';

/**
 * /inbox/[conversationId] — Individual conversation view
 * Real-time message bubbles, auto-scroll, mark-as-read on open
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
  offer_data: any;
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

  const timeStr = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-black/90 backdrop-blur-md z-10">
          <Link href="/inbox" className="text-gray-400 hover:text-white transition-colors text-lg">
            ←
          </Link>
          <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-gray-400 text-xs font-bold">
            💬
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-bold">Conversation</p>
            <p className="text-gray-500 text-[10px]">{messages.length} messages</p>
          </div>
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
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-accent text-black rounded-br-md'
                        : 'bg-white/[0.06] text-white rounded-bl-md'
                    }`}
                  >
                    {msg.message_type === 'offer' && msg.offer_data && (
                      <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isMine ? 'text-black/60' : 'text-accent'}`}>
                        OFFER
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-black/50' : 'text-gray-500'}`}>
                      {timeStr(msg.created_at)}
                      {isMine && msg.read_at && ' · Read'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

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
