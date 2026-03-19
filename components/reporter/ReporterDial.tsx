"use client";

import React, { useState, useRef } from 'react';
import { MessageSquare, X, Bot, Send, Loader2 } from 'lucide-react';

export function ReporterDial() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: userMsg }),
            });
            const data = await res.json();
            const text = data.text || data.error?.message || data.error || 'No response';
            setMessages(prev => [...prev, { role: 'assistant', content: typeof text === 'string' ? text : JSON.stringify(text) }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error — please try again.' }]);
        } finally {
            setLoading(false);
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
        }
    };

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-50 flex items-center justify-center
                    ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-[#ffb400] text-black hover:bg-yellow-400 hover:scale-105'}`}
            >
                <MessageSquare size={24} />
            </button>

            {/* Chat Window — Powered by Claude */}
            <div className={`fixed bottom-6 right-6 w-96 h-[480px] max-h-[80vh] bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl shadow-2xl flex flex-col z-50 transition-all origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
            >
                <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#111] rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ffb400]/20 flex items-center justify-center text-[#ffb400]">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Reporter Intel Agent</h3>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest">● Online — Claude</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                        <div className="text-center text-[#444] text-xs mt-8 space-y-2">
                            <Bot size={32} className="mx-auto opacity-20" />
                            <p className="uppercase font-bold tracking-widest">Haul Command AI</p>
                            <p className="text-[10px]">Ask about corridors, rates, regulations, or anything heavy haul.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-[#ffb400]/20 text-[#ffb400] border border-[#ffb400]/20'
                                    : 'bg-[#151515] text-[#ccc] border border-[#1a1a1a]'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-[#151515] border border-[#1a1a1a] px-3 py-2 rounded-lg">
                                <Loader2 size={14} className="animate-spin text-[#ffb400]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-[#1a1a1a] flex gap-2">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Ask anything..."
                        className="flex-1 bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#ffb400]/40"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="bg-[#ffb400] text-black rounded-lg px-3 py-2 disabled:opacity-30 hover:bg-yellow-400 transition-colors"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </>
    );
}
