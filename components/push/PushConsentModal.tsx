'use client';
/**
 * components/push/PushConsentModal.tsx
 * Haul Command — Push Notification Consent Prompt
 *
 * A premium, high-conversion modal that:
 * 1. Appears after meaningful engagement (not on first load)
 * 2. Explains the exact value: load matches, urgent alerts, payment events
 * 3. Triggers native browser permission prompt on "Enable"
 * 4. Handles denied/unsupported gracefully
 * 5. Remembers decision in localStorage (no repeat prompts)
 *
 * Usage:
 *   <PushConsentModal role="operator" geo="TX" />
 */

import { useState, useEffect } from 'react';

interface Props {
  role?: 'operator' | 'broker' | 'dispatcher';
  geo?: string;
  onClose?: () => void;
  forceShow?: boolean; // for Storybook/testing
}

const ROLE_BENEFITS: Record<string, string[]> = {
  operator: [
    '⚡ New load matches in your area — first to respond wins',
    '💰 Escrow payment releases and urgent alerts',
    '📋 Route assignments and broker messages',
    '🛡️ Insurance & document expiry warnings before suspension',
  ],
  broker: [
    '⚡ Operator accepts your load request',
    '📍 Coverage gaps filled in your corridor',
    '💬 Bid responses and quote updates',
    '🔔 Urgent replacement needed alerts',
  ],
  dispatcher: [
    '⚡ Assignment status changes in real time',
    '🛣️ Route and compliance alerts by corridor',
    '💬 Operator check-ins and delay notifications',
  ],
};

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}

export default function PushConsentModal({ role = 'operator', geo, onClose, forceShow = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'prompt' | 'subscribing' | 'success' | 'denied' | 'unsupported'>('prompt');

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    const dismissed = localStorage.getItem('hc_push_dismissed');
    const subscribed = localStorage.getItem('hc_push_subscribed');
    if (dismissed || subscribed) return;
    // Show after 8s of engagement — not immediately
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, [forceShow]);

  const handleEnable = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStep('unsupported');
      return;
    }
    setStep('subscribing');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/push/send?vapid=1');
      if (!keyRes.ok) throw new Error('VAPID key unavailable');
      const { publicKey } = await keyRes.json();
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStep('denied');
        localStorage.setItem('hc_push_dismissed', '1');
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const subJson = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys, role, geo }),
      });
      localStorage.setItem('hc_push_subscribed', '1');
      setStep('success');
      setTimeout(() => handleClose(), 2500);
    } catch (err) {
      console.error('[PushConsentModal]', err);
      setStep('prompt');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('hc_push_dismissed', '1');
    handleClose();
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  const benefits = ROLE_BENEFITS[role] ?? ROLE_BENEFITS.operator;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#0d1117] shadow-2xl shadow-amber-500/10 p-6 animate-slide-up">

        {step === 'success' ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-lg font-bold text-white">You're in.</p>
            <p className="text-sm text-gray-400 mt-1">Load alerts and urgent updates enabled.</p>
          </div>
        ) : step === 'denied' ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-300">
              Notifications blocked. Enable them in your browser settings to receive load matches.
            </p>
            <button onClick={handleClose} className="mt-4 text-xs text-gray-500 underline">Close</button>
          </div>
        ) : step === 'unsupported' ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-300">Push notifications aren't supported in this browser.</p>
            <button onClick={handleClose} className="mt-4 text-xs text-gray-500 underline">Close</button>
          </div>
        ) : (
          <>
            {/* Icon + headline */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
                🔔
              </div>
              <div>
                <h2 id="push-modal-title" className="text-base font-bold text-white leading-tight">
                  Be first to every load in your area
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enable alerts — it takes one tap.
                </p>
              </div>
            </div>

            {/* Benefits list */}
            <ul className="space-y-2 mb-6">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-xs mt-0.5 flex-shrink-0">{b.substring(0, 2)}</span>
                  <span>{b.substring(2).trim()}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEnable}
                disabled={step === 'subscribing'}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all disabled:opacity-60"
                id="push-enable-btn"
              >
                {step === 'subscribing' ? 'Enabling…' : 'Enable load alerts'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
