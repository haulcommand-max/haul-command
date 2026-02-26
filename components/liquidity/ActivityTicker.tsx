"use client";

import { useEffect, useRef, useState } from "react";

interface TickerItem {
    id: string;
    text: string;
    kind: "load" | "presence" | string;
}

interface ActivityTickerProps {
    className?: string;
}

const KIND_ICON: Record<string, string> = {
    load: "📦",
    presence: "📡",
};

export function ActivityTicker({ className = "" }: ActivityTickerProps) {
    const [items, setItems] = useState<TickerItem[]>([]);
    const [paused, setPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchActivity = async () => {
        try {
            const res = await fetch("/api/activity?limit=12", { cache: "no-store" });
            if (!res.ok) return;
            const json = await res.json();
            if (json.items?.length) setItems(json.items);
        } catch {
            // silent — ticker is non-critical
        }
    };

    useEffect(() => {
        fetchActivity();
        intervalRef.current = setInterval(fetchActivity, 10_000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    if (!items.length) return null;

    // Duplicate items so the marquee loops seamlessly
    const doubled = [...items, ...items];

    return (
        <div
            className={`relative overflow-hidden bg-gray-950/90 border-b border-orange-500/30 h-9 flex items-center ${className}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            aria-label="Live activity feed"
        >
            {/* Gradient fade edges */}
            <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

            {/* Live dot */}
            <span className="absolute left-3 z-20 flex items-center gap-1 text-orange-400 text-[10px] font-bold tracking-widest">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                LIVE
            </span>

            <div
                className="flex whitespace-nowrap pl-16"
                style={{
                    animation: paused ? "none" : "ticker-scroll 40s linear infinite",
                    willChange: "transform",
                }}
            >
                {doubled.map((item, i) => (
                    <span
                        key={`${item.id}-${i}`}
                        className="inline-flex items-center gap-2 px-6 text-sm text-gray-300"
                    >
                        <span className="text-base">
                            {KIND_ICON[item.kind] ?? "🔔"}
                        </span>
                        {item.text}
                        <span className="text-gray-600 select-none">·</span>
                    </span>
                ))}
            </div>

            <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
        </div>
    );
}
