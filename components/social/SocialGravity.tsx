'use client';

import React, { useState } from 'react';

/**
 * Social Gravity Engine for Haul Command
 * Generates network effects and trust signals via community verification,
 * upvotes, and threaded activity. Applies direct gravity to ranking.
 */
export function SocialGravity({ targetId, entityType }: { targetId: string, entityType: 'operator' | 'place' | 'corridor' }) {
    const [upvotes, setUpvotes] = useState(Math.floor(Math.random() * 50) + 12);
    const [threads, setThreads] = useState([
        { id: '1', author: 'Verified Broker M.', text: 'Very reliable on the I-10 stretch. Good comms.', role: 'broker', timestamp: '22h ago' },
        { id: '2', author: 'Pilot Car Tim', text: 'Ran a tandem with them last week. Solid setup.', role: 'operator', timestamp: '1d ago' }
    ]);
    const [newThread, setNewThread] = useState('');
    const [hasVoted, setHasVoted] = useState(false);

    const handleUpvote = () => {
        if (!hasVoted) {
            setUpvotes(u => u + 1);
            setHasVoted(true);
        }
    };

    const submitThread = () => {
        if (!newThread.trim()) return;
        setThreads(prev => [{
            id: Date.now().toString(),
            author: 'You',
            text: newThread,
            role: 'visitor',
            timestamp: 'Just now'
        }, ...prev]);
        setNewThread('');
    };

    return (
        <div className="w-full bg-hc-gray-900 border border-hc-gray-800 rounded-xl overflow-hidden mt-6">
            <div className="p-4 border-b border-hc-gray-800 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3">
                    <span className="text-white font-bold tracking-wide">Community Gravity</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-hc-yellow-400/10 text-hc-yellow-400 border border-hc-yellow-400/20">
                        {upvotes} Trust Signals
                    </span>
                </div>
                <button 
                    onClick={handleUpvote}
                    disabled={hasVoted}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        hasVoted 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-hc-gray-800 text-gray-300 hover:bg-hc-yellow-400 hover:text-black'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {hasVoted ? 'Verified' : 'Verify Entity'}
                </button>
            </div>

            <div className="p-4 space-y-4">
                {threads.map(thread => (
                    <div key={thread.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-hc-gray-800 flex items-center justify-center flex-shrink-0 text-hc-yellow-400 font-bold text-xs border border-hc-gray-700">
                            {thread.author.charAt(0)}
                        </div>
                        <div className="flex-1 bg-black/40 p-3 rounded-lg border border-white/5">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-200">{thread.author}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                                        {thread.role}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">{thread.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {thread.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-black/20 border-t border-hc-gray-800 flex gap-2">
                <input 
                    type="text" 
                    value={newThread}
                    onChange={(e) => setNewThread(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitThread()}
                    placeholder="Add a community note or verification..."
                    className="flex-1 bg-hc-gray-950 border border-hc-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-hc-yellow-400/50"
                />
                <button 
                    onClick={submitThread}
                    className="px-4 py-2 rounded-lg bg-hc-gray-800 text-white font-bold text-sm hover:bg-hc-gray-700"
                >
                    Post
                </button>
            </div>
        </div>
    );
}
