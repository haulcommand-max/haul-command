"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; ts: string; text: string; kind: string };

export function ActivityTicker() {
    // Both flags must be true for the ticker to render
    if (process.env.NEXT_PUBLIC_FEATURE_LIQUIDITY_BOOST !== "true") return null;
    if (process.env.NEXT_PUBLIC_ACTIVITY_TICKER !== "true") return null;

    return <ActivityTickerInner />;
}

function ActivityTickerInner() {
    const [items, setItems] = useState<Item[]>([]);
    const [idx, setIdx] = useState(0);

    const current = useMemo(
        () => items[idx % Math.max(items.length, 1)],
        [items, idx]
    );

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const res = await fetch("/api/activity?limit=18", { cache: "no-store" });
                const json = await res.json();
                if (!mounted) return;
                setItems(Array.isArray(json.items) ? json.items : []);
                setIdx(0);
            } catch (_) { /* silently ignore fetch errors */ }
        }

        load();
        const refresh = window.setInterval(load, 45_000);
        return () => { mounted = false; clearInterval(refresh); };
    }, []);

    // Rotate between 8 and 12 seconds (organic feel)
    useEffect(() => {
        if (items.length <= 1) return;
        const ms = 8_000 + Math.floor(Math.random() * 4_000);
        const t = window.setTimeout(() => setIdx(n => n + 1), ms);
        return () => clearTimeout(t);
    }, [idx, items.length]);

    if (!current) return null;

    const isLoad = current.kind === "load";
    const dotColor = isLoad ? "#22c55e" : "#60a5fa";

    return (
        <div
            style={{
                marginTop: 8,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
            }}
        >
            {/* Pulsing dot */}
            <span style={{ position: "relative", display: "inline-flex", width: 8, height: 8, flexShrink: 0 }}>
                <span style={{
                    position: "absolute", inset: 0,
                    borderRadius: "50%",
                    background: dotColor,
                    opacity: 0.5,
                    animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                }} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
            </span>

            <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {current.text}
                </div>
            </div>

            <div style={{ fontSize: 10, color: "#555", flexShrink: 0 }}>
                {formatAgo(current.ts)}
            </div>

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2.2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

function formatAgo(ts: string) {
    const s = Math.max(1, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
}
