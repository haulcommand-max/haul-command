'use client';

import { useState } from "react";
import { format } from "date-fns";

export function ShareLinkManager({ cois }: { cois: any[] }) {
    const [copied, setCopied] = useState(false);

    // Grab the first active COI that has sharing enabled, or just the first COI
    const shareableCoi = cois.find(c => c.status === 'active' && c.share_enabled) || cois[0];

    if (!shareableCoi) {
        return (
            <div className="bg-[#141e28] border border-[#1e3048] rounded px-4 py-3 text-sm text-[#8ab0d0]">
                Upload an active COI to unlock 1-click sharing.
            </div>
        );
    }

    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://haulcommand.com'}/documents/share/${shareableCoi.share_token}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-[#0a1118] border border-[#1e3048] p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4">
            <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Your Vault Link</h4>
                <p className="text-[10px] text-[#8ab0d0] uppercase">Send this to brokers instead of PDFs</p>
            </div>
            
            <div className="flex-1 flex w-full">
                <input 
                    type="text" 
                    readOnly 
                    value={shareUrl} 
                    className="flex-1 bg-[#141e28] border-y border-l border-[#1e3048] rounded-l-lg px-3 py-2 text-xs font-mono text-[#8ab0d0] outline-none"
                    onClick={(e) => e.currentTarget.select()}
                />
                <button 
                    onClick={handleCopy}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-r-lg transition-colors border-y border-r border-[#1e3048] ${copied ? 'bg-green-500 text-black border-green-500' : 'bg-[#e8a828] text-black hover:bg-[#ffe399]'}`}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
}
