"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ══════════════════════════════════════════════════════════════════════════════
// NotificationInbox — real-time in-app notification list
// Reads from notification_events table (scoped to auth.uid())
// Displays unread badge count in a collapsible panel
// ══════════════════════════════════════════════════════════════════════════════

interface NotificationEvent {
    id: string;
    type: string;
    title: string;
    body: string;
    read_at: string | null;
    created_at: string;
    metadata: Record<string, any> | null;
    action_url: string | null;
}

const TYPE_ICONS: Record<string, string> = {
    load_match: "🎯",
    load_filled: "✅",
    trust_score_up: "📈",
    trust_score_down: "📉",
    cert_expiring: "⚠️",
    payment_received: "💰",
    review_received: "⭐",
    system: "🔔",
};

function timeAgo(dateStr: string) {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}

export function NotificationInbox() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const unreadCount = notifications.filter(n => !n.read_at).length;

    const fetchNotifications = useCallback(async () => {
        const { data } = await supabase
            .from("notification_events")
            .select("id, type, title, body, read_at, created_at, metadata, action_url")
            .order("created_at", { ascending: false })
            .limit(30);
        if (data) setNotifications(data as NotificationEvent[]);
        setLoading(false);
    }, []);

    async function markAllRead() {
        const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
        if (!unreadIds.length) return;
        await supabase
            .from("notification_events")
            .update({ read_at: new Date().toISOString() })
            .in("id", unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    }

    async function markRead(id: string) {
        await supabase
            .from("notification_events")
            .update({ read_at: new Date().toISOString() })
            .eq("id", id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    }

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription for new notifications
        const channel = supabase
            .channel("notification-inbox-live")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "notification_events",
            }, (payload) => {
                const incoming = payload.new as NotificationEvent;
                setNotifications(prev => [incoming, ...prev]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchNotifications]);

    return (
        <div style={{ position: "relative" }}>
            {/* Bell button */}
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
                aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
                style={{
                    position: "relative",
                    width: 40, height: 40,
                    borderRadius: 12,
                    background: open ? "rgba(217,119,6,0.12)" : "var(--hc-panel, #1a1a1a)",
                    border: `1px solid ${open ? "rgba(217,119,6,0.4)" : "var(--hc-border, #333)"}`,
                    color: "var(--hc-text, #f5f5f5)",
                    fontSize: 17,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: "absolute", top: -4, right: -4,
                        minWidth: 18, height: 18, padding: "0 4px",
                        borderRadius: 9,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 10, fontWeight: 900,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid var(--hc-bg, #0a0a0a)",
                    }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    width: 360, maxHeight: 480,
                    background: "var(--hc-panel, #141414)",
                    border: "1px solid var(--hc-border, #222)",
                    borderRadius: 16,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    overflow: "hidden",
                    display: "flex", flexDirection: "column",
                    zIndex: 100,
                }}>
                    {/* Header */}
                    <div style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--hc-border, #222)",
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{
                                    fontSize: 11, color: "#d97706", fontWeight: 700,
                                    background: "none", border: "none", cursor: "pointer", padding: 0,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {loading ? (
                            <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--hc-muted, #888)", fontSize: 13 }}>
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: "32px 16px", textAlign: "center" }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                                <p style={{ fontSize: 13, color: "var(--hc-muted, #888)", margin: 0 }}>
                                    No notifications yet. Enable push alerts to stay in the loop.
                                </p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const icon = TYPE_ICONS[n.type] ?? "🔔";
                                const isUnread = !n.read_at;
                                const Row = n.action_url ? Link : "div" as any;
                                return (
                                    <Row
                                        key={n.id}
                                        href={n.action_url ?? undefined}
                                        onClick={() => !n.read_at && markRead(n.id)}
                                        style={{
                                            display: "flex", gap: 12, padding: "12px 16px",
                                            background: isUnread ? "rgba(217,119,6,0.04)" : "transparent",
                                            borderBottom: "1px solid var(--hc-border, #1a1a1a)",
                                            cursor: "pointer",
                                            textDecoration: "none",
                                            color: "inherit",
                                            transition: "background 0.15s",
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            fontSize: 20, lineHeight: 1, flexShrink: 0,
                                            width: 36, height: 36,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: "var(--hc-elevated, #1e1e1e)",
                                            borderRadius: 10,
                                        }}>
                                            {icon}
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                                                <p style={{
                                                    margin: 0, fontSize: 13, fontWeight: isUnread ? 800 : 600,
                                                    color: "var(--hc-text, #f5f5f5)",
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                }}>
                                                    {n.title}
                                                </p>
                                                <span style={{ fontSize: 10, color: "var(--hc-muted, #888)", flexShrink: 0 }}>
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                            <p style={{
                                                margin: "2px 0 0", fontSize: 12,
                                                color: "var(--hc-muted, #aaa)",
                                                overflow: "hidden", textOverflow: "ellipsis",
                                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any,
                                            }}>
                                                {n.body}
                                            </p>
                                        </div>

                                        {/* Unread dot */}
                                        {isUnread && (
                                            <div style={{
                                                width: 7, height: 7, borderRadius: "50%",
                                                background: "#d97706", flexShrink: 0, marginTop: 4,
                                            }} />
                                        )}
                                    </Row>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "10px 16px", borderTop: "1px solid var(--hc-border, #222)", textAlign: "center" }}>
                        <Link href="/notifications" style={{ fontSize: 12, color: "#d97706", fontWeight: 700, textDecoration: "none" }}>
                            View all notifications →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationInbox;
