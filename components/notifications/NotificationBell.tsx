'use client';

import { useState, useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';

interface Notification {
    id: string;
    type: 'load_match' | 'dispatch' | 'review' | 'system' | 'rank_change' | 'payment';
    title: string;
    body: string;
    read: boolean;
    created_at: string;
    action_url?: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadNotifications();
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadNotifications = async () => {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data as any[]);
            setUnread(data.filter((n: any) => !n.read).length);
        }
    };

    const markAllRead = async () => {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
    };

    const icon = (type: string) => {
        switch (type) {
            case 'load_match': return '📦';
            case 'dispatch': return '🚀';
            case 'review': return '⭐';
            case 'rank_change': return '🏆';
            case 'payment': return '💰';
            default: return '🔔';
        }
    };

    const timeAgo = (date: string) => {
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m`;
        if (s < 86400) return `${Math.floor(s / 3600)}h`;
        return `${Math.floor(s / 86400)}d`;
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button aria-label="Interactive Button"
                onClick={() => setOpen(!open)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                    padding: 8, fontSize: 20, color: '#9CA3AF', transition: 'color 0.15s',
                }}
                aria-label={`Notifications (${unread} unread)`}
            >
                🔔
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
                        background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'bellPulse 2s infinite',
                    }}>{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, width: 360,
                    background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                    zIndex: 1000, maxHeight: 480, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>Notifications</span>
                        {unread > 0 && (
                            <button aria-label="Interactive Button" onClick={markAllRead} style={{
                                background: 'none', border: 'none', color: '#F59E0B',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}>Mark all read</button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                                No notifications yet
                            </div>
                        ) : notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => n.action_url && (window.location.href = n.action_url)}
                                style={{
                                    padding: '12px 16px', cursor: n.action_url ? 'pointer' : 'default',
                                    background: n.read ? 'transparent' : 'rgba(245,158,11,0.04)',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    display: 'flex', gap: 10, transition: 'background 0.15s',
                                }}
                            >
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon(n.type)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: n.read ? '#9CA3AF' : '#F9FAFB', marginBottom: 2 }}>
                                        {n.title}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {n.body}
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: '#6B7280', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                                {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, marginTop: 6 }} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes bellPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
