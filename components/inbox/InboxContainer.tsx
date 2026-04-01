'use client';

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Message = {
  id: string;
  sender_id: string;
  body: string;
  message_type: string;
  offer_data?: any;
  created_at: string;
};

type Conversation = {
  id: string;
  last_message_preview: string;
  last_message_at: string;
  conversation_type: string;
  unread_count: number;
};

export default function InboxContainer() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'all' | 'offers' | 'messages'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadConversations();
    getUserId();
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv);
      markRead(activeConv);
    }
  }, [activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`messages:${activeConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv]);

  async function getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  }

  async function loadConversations() {
    setLoading(true);
    const res = await fetch('/api/messaging/conversations');
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  async function loadMessages(convId: string) {
    const res = await fetch(`/api/messaging/messages/${convId}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function markRead(convId: string) {
    await fetch('/api/messaging/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_id: convId }),
    });
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConv || sending) return;
    setSending(true);
    await fetch('/api/messaging/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: activeConv,
        body: newMessage.trim(),
        message_type: 'text',
      }),
    });
    setNewMessage('');
    setSending(false);
  }

  async function respondToOffer(messageId: string, action: 'accept' | 'decline' | 'counter') {
    let counter_rate: number | undefined;
    if (action === 'counter') {
      const input = window.prompt('Enter your counter rate per day ($)');
      if (!input) return;
      counter_rate = parseFloat(input);
    }
    await fetch('/api/messaging/respond-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, action, counter_rate }),
    });
    if (activeConv) loadMessages(activeConv);
  }

  const filteredConvs = conversations.filter((c) => {
    if (tab === 'offers') return c.conversation_type === 'load_offer';
    if (tab === 'messages') return c.conversation_type === 'direct';
    return true;
  });

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a]">
      {/* Conversation List */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Inbox</h2>
          <div className="flex gap-1 mt-3">
            {(['all', 'offers', 'messages'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  tab === t
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'all' ? 'All' : t === 'offers' ? 'Offers' : 'Messages'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                  activeConv === conv.id ? 'bg-white/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {conv.conversation_type === 'load_offer' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                    <span className="font-medium text-sm text-white">
                      {conv.conversation_type === 'load_offer' ? 'Load Offer' : 'Message'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-black text-xs font-bold rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {conv.last_message_preview || 'No messages yet'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Thread header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden text-gray-400 hover:text-white"
              >
                \u2190
              </button>
              <h3 className="font-semibold text-white">Conversation</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.sender_id === userId;
                const isOffer = ['offer', 'counter_offer'].includes(msg.message_type);
                const isSystem = ['system', 'acceptance', 'decline'].includes(msg.message_type);

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="px-3 py-1 bg-white/5 text-xs text-gray-400 rounded-full">
                        {msg.body}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/10 text-white'
                    } ${isOffer ? 'border-2 border-amber-500/50' : ''}`}>
                      {isOffer && msg.offer_data && (
                        <div className="mb-2 pb-2 border-b border-black/10">
                          <p className="font-bold text-sm">
                            {msg.message_type === 'counter_offer' ? 'Counter Offer' : 'Load Offer'}
                          </p>
                          <p className="text-lg font-bold">
                            ${msg.offer_data.rate_per_day}/day
                          </p>
                        </div>
                      )}
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-black/50' : 'text-gray-500'}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                      {isOffer && !isMe && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
                          <button
                            onClick={() => respondToOffer(msg.id, 'accept')}
                            className="flex-1 min-w-[85px] flex items-center justify-center gap-1.5 px-2 py-2.5 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors text-green-400 font-bold text-[11px] uppercase tracking-widest rounded-xl"
                          >✓ Accept</button>
                          <button
                            onClick={() => respondToOffer(msg.id, 'counter')}
                            className="flex-1 min-w-[85px] flex items-center justify-center gap-1.5 px-2 py-2.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-blue-400 font-bold text-[11px] uppercase tracking-widest rounded-xl"
                          >↺ Counter</button>
                          <button
                            onClick={() => respondToOffer(msg.id, 'decline')}
                            className="flex-1 min-w-[85px] flex items-center justify-center gap-1.5 px-2 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-red-400 font-bold text-[11px] uppercase tracking-widest rounded-xl"
                          >✕ Decline</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-3">\ud83d\udce8</p>
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
