'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, CheckCircle, Shield, Star, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   /boost — Operator Boost Page
   Self-service boost checkout for directory priority placement
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', bgCard: '#0f1a26', border: 'rgba(255,255,255,0.07)',
  gold: '#f5b942', green: '#27d17f', text: '#f0f4f8', muted: '#8fa3b8',
} as const;

const PLANS = [
  { days: 7, price: '$19', label: '7 Days', desc: 'Test the waters', popular: false },
  { days: 30, price: '$59', label: '30 Days', desc: 'Most popular', popular: true },
  { days: 90, price: '$149', label: '90 Days', desc: 'Best value — saves $28', popular: false },
];

const BENEFITS = [
  { icon: Star, text: 'Gold border + "Sponsored" badge on your card' },
  { icon: Zap, text: 'Priority placement at top of search results' },
  { icon: Shield, text: 'Appear first in state & corridor results' },
  { icon: Clock, text: 'Auto-expires — no surprise renewals' },
];

export default function BoostPage() {
  const [loading, setLoading] = useState<number | null>(null);

  const handleBoost = async (days: number) => {
    setLoading(days);
    try {
      const res = await fetch('/api/adgrid/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_days: days }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert(data.error || 'Please sign in first');
      }
    } catch {
      alert('Could not start checkout');
    }
    setLoading(null);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Hero */}
      <div style={{
        padding: '64px 24px 48px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(245,185,66,0.05), transparent)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(245,185,66,0.1)', border: '1px solid rgba(245,185,66,0.2)', marginBottom: 16 }}>
          <Zap size={13} style={{ color: T.gold }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            AdGrid Boost
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, margin: '0 0 12px', lineHeight: 1.2 }}>
          Boost Your <span style={{ color: T.gold }}>Directory Listing</span>
        </h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          Get priority placement, gold badge, and top-of-search positioning. Reach more brokers and get more loads.
        </p>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
          {PLANS.map(plan => (
            <div key={plan.days} style={{
              background: plan.popular ? 'linear-gradient(135deg, rgba(245,185,66,0.06), rgba(245,185,66,0.02))' : T.bgCard,
              border: `1px solid ${plan.popular ? 'rgba(245,185,66,0.35)' : T.border}`,
              borderRadius: 20, padding: '28px 24px', position: 'relative',
              boxShadow: plan.popular ? '0 0 30px rgba(245,185,66,0.1)' : 'none',
            }}>
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  fontSize: 10, fontWeight: 800, color: '#000', background: T.gold,
                  padding: '3px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>Most Popular</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: T.muted, marginBottom: 8 }}>{plan.label}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: T.text, marginBottom: 6 }}>{plan.price}</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>{plan.desc}</div>
              <button
                onClick={() => handleBoost(plan.days)}
                disabled={loading === plan.days}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: plan.popular ? 'linear-gradient(135deg, #f5b942, #e8a830)' : 'rgba(255,255,255,0.06)',
                  color: plan.popular ? '#000' : T.text, fontSize: 14, fontWeight: 800,
                  transition: 'all 0.2s',
                }}
              >
                {loading === plan.days ? 'Loading...' : `Boost for ${plan.label}`}
              </button>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, marginBottom: 20, textAlign: 'center' }}>
            What You Get
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14,
              }}>
                <b.icon size={18} style={{ color: T.gold, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: T.muted }}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to directory */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.gold, textDecoration: 'none', fontWeight: 700 }}>
            ← Back to Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
