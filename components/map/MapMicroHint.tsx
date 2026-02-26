'use client';

import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'hc_map_hint_visits';
const MAX_VISITS = 3;
const FADE_DELAY_MS = 2000;

export function MapMicroHint() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const visits = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
            if (visits < MAX_VISITS) {
                setVisible(true);
                localStorage.setItem(STORAGE_KEY, String(visits + 1));
                const timer = setTimeout(() => setVisible(false), FADE_DELAY_MS);
                return () => clearTimeout(timer);
            }
        } catch {
            // localStorage unavailable — skip hint
        }
    }, []);

    if (!visible) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-full px-5 py-2 text-xs text-slate-300 font-medium animate-fade-in-out">
                pinch to zoom • tap a state
            </div>
            <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .animate-fade-in-out {
          animation: fadeInOut ${FADE_DELAY_MS}ms ease-in-out forwards;
        }
      `}</style>
        </div>
    );
}
