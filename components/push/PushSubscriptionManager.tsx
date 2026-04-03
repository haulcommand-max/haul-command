'use client';
// components/push/PushSubscriptionManager.tsx
// Drop anywhere to enable push notifications for the current user.
// Handles: SW registration, VAPID key fetch, pushManager.subscribe(), server sync.
//
// Usage:
//   <PushSubscriptionManager role="pilot_car_operator" geo="TX" />
//   <PushSubscriptionManager quiet />   ← no UI, just auto-registers silently

import { useEffect, useState } from 'react';

interface Props {
    role?: string;
    geo?: string;
    quiet?: boolean;         // If true, no UI — silently auto-subscribes
    onSubscribed?: () => void;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

export default function PushSubscriptionManager({ role, geo, quiet = false, onSubscribed }: Props) {
    const [status, setStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported'>('idle');

    const subscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setStatus('unsupported');
            return;
        }

        setStatus('subscribing');
        try {
            // 1. Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // 2. Fetch VAPID public key
            const keyRes = await fetch('/api/push/send?vapid=1');
            if (!keyRes.ok) throw new Error('VAPID key unavailable');
            const { publicKey } = await keyRes.json();

            // 3. Request permission + subscribe
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setStatus('denied');
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // 4. Serialize and send to /api/push/subscribe
            const sub = subscription.toJSON();
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: sub.keys,
                    role: role ?? null,
                    geo: geo ?? null,
                }),
            });

            setStatus('subscribed');
            onSubscribed?.();

            // Persist state locally
            try { localStorage.setItem('hc_push_subscribed', '1'); } catch {}

        } catch (err) {
            console.error('[PushSubscriptionManager]', err);
            setStatus('idle');
        }
    };

    // Auto-subscribe silently (quiet mode) or if already subscribed
    useEffect(() => {
        const alreadySubscribed = localStorage.getItem('hc_push_subscribed') === '1';
        if (alreadySubscribed) { setStatus('subscribed'); return; }
        if (quiet) subscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (quiet) return null;
    if (status === 'subscribed') return (
        <p className="text-xs text-green-400 flex items-center gap-1">
            <span>🔔</span> Load alerts enabled
        </p>
    );
    if (status === 'unsupported') return null;
    if (status === 'denied') return (
        <p className="text-xs text-gray-500">Notifications blocked. Enable in browser settings to get load alerts.</p>
    );

    return (
        <button
            onClick={subscribe}
            disabled={status === 'subscribing'}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
        >
            <span>{status === 'subscribing' ? '⏳' : '🔔'}</span>
            {status === 'subscribing' ? 'Enabling…' : 'Enable load alerts'}
        </button>
    );
}
