"use client";

import React, { useState } from 'react';
import { MessageSquare, X, Bot, AlertCircle } from 'lucide-react';

// Stubbed until `ai` package is installed: npm install ai @ai-sdk/openai
export function ReporterDial() {
    const [isOpen, setIsOpen] = useState(false);

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

            {/* Chat Window — Stub */}
            <div className={`fixed bottom-6 right-6 w-96 h-[400px] max-h-[80vh] bg-[#0c0c0c] border border-[#1a1a1a] rounded-xl shadow-2xl flex flex-col z-50 transition-all origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
            >
                <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#111] rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ffb400]/20 flex items-center justify-center text-[#ffb400]">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wider">Reporter Intel Agent</h3>
                            <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest">Setup Required</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center text-[#666] space-y-4 p-6">
                    <Bot size={48} className="opacity-20" />
                    <div>
                        <p className="text-xs uppercase font-bold tracking-widest mb-2">AI Reporter Coming Soon</p>
                        <p className="text-[10px] leading-relaxed">
                            Install <code className="bg-[#1a1a1a] px-1 rounded">ai</code> and <code className="bg-[#1a1a1a] px-1 rounded">@ai-sdk/openai</code> packages to enable the Reporter.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[9px] uppercase tracking-widest text-[#444] font-bold">
                        <AlertCircle size={10} /> Run: npm install ai @ai-sdk/openai
                    </div>
                </div>
            </div>
        </>
    );
}
