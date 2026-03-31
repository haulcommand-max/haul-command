'use client';

/**
 * REACTIVATION MODAL — Presence UI Surface #3
 *
 * Wakes idle operators without feeling spammy.
 * 3 variants: primary (activity), urgency (demand), rank_protection (visibility).
 *
 * Rules:
 *   - Min 18h between modals
 *   - Max 3 per week
 *   - Suppress if recent job
 *   - Quiet hours 22:00-06:30
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

type ModalVariant = 'primary' | 'urgency' | 'rank_protection';

interface ReactivationModalProps {
    variant: ModalVariant;
    corridorName?: string;
    loadCount?: number;
    isVisible: boolean;
    onGoAvailable: () => void;
    onSetLater: () => void;
    onDismiss: () => void;
}

// ── Copy per variant (exact spec) ────────────────────────────────────────────

const VARIANTS: Record<ModalVariant, {
    title: string;
    body: string;
    primaryLabel: string;
    secondaryLabel: string;
    dismissLabel: string;
    accentColor: string;
    accentBg: string;
    accentBorder: string;
    icon: string;
}> = {
    primary: {
        title: 'activity picking up near you',
        body: 'brokers are active near your usual routes.\na quick check-in keeps you visible for new loads.',
        primaryLabel: 'go available now',
        secondaryLabel: 'set availability later',
        dismissLabel: 'not now',
        accentColor: '#10b981',
        accentBg: 'rgba(16,185,129,0.1)',
        accentBorder: 'rgba(16,185,129,0.3)',
        icon: '📡',
    },
    urgency: {
        title: 'demand building in your area',
        body: 'nearby movement suggests strong booking potential.\noperators who check in early get priority visibility.',
        primaryLabel: 'check in now',
        secondaryLabel: 'set availability later',
        dismissLabel: 'maybe later',
        accentColor: '#f59e0b',
        accentBg: 'rgba(245,158,11,0.1)',
        accentBorder: 'rgba(245,158,11,0.3)',
        icon: '🔥',
    },
    rank_protection: {
        title: 'stay visible to brokers',
        body: 'inactive operators may drop in local search.\na quick check-in keeps your position strong.',
        primaryLabel: 'stay visible',
        secondaryLabel: 'set availability later',
        dismissLabel: 'dismiss',
        accentColor: '#8b5cf6',
        accentBg: 'rgba(139,92,246,0.1)',
        accentBorder: 'rgba(139,92,246,0.3)',
        icon: '📊',
    },
};

// ── Toast copy ───────────────────────────────────────────────────────────────

const TOAST_COPY = {
    available_now: { title: "you're back in the mix", subtitle: 'brokers can now see you nearby' },
    available_later: { title: 'availability updated', subtitle: "you'll appear in upcoming searches" },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function ReactivationModal({
    variant,
    corridorName,
    loadCount,
    isVisible,
    onGoAvailable,
    onSetLater,
    onDismiss,
}: ReactivationModalProps) {
    const [showToast, setShowToast] = useState<{ title: string; subtitle: string } | null>(null);
    const v = VARIANTS[variant];

    useEffect(() => {
        if (showToast) {
            const t = setTimeout(() => setShowToast(null), 3500);
            return () => clearTimeout(t);
        }
    }, [showToast]);

    const handleAvailable = () => {
        onGoAvailable();
        setShowToast(TOAST_COPY.available_now);
    };

    const handleLater = () => {
        onSetLater();
        setShowToast(TOAST_COPY.available_later);
    };

    return (
        <>
            <AnimatePresence>
                {isVisible && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onDismiss}
                            style={{
                                position: 'fixed', inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 200,
                            }}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'fixed',
                                bottom: '10%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '92%',
                                maxWidth: 400,
                                background: 'rgba(18,18,24,0.98)',
                                border: `1px solid ${v.accentBorder}`,
                                borderRadius: 20,
                                padding: '28px 24px 20px',
                                zIndex: 201,
                                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${v.accentBg}`,
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                width: 52, height: 52, borderRadius: 14,
                                background: v.accentBg, border: `1px solid ${v.accentBorder}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 24, marginBottom: 18,
                            }}>
                                {v.icon}
                            </div>

                            {/* Title */}
                            <h3 style={{
                                color: '#fff', fontSize: 18, fontWeight: 700,
                                margin: '0 0 10px', lineHeight: 1.3,
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}>
                                {v.title}
                            </h3>

                            {/* Body */}
                            <p style={{
                                color: 'rgba(255,255,255,0.55)', fontSize: 14,
                                margin: '0 0 24px', lineHeight: 1.6,
                                whiteSpace: 'pre-line',
                                fontFamily: 'Inter, system-ui, sans-serif',
                            }}>
                                {v.body}
                            </p>

                            {/* Primary CTA */}
                            <button aria-label="Interactive Button"
                                onClick={handleAvailable}
                                style={{
                                    width: '100%',
                                    background: v.accentColor,
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: 12,
                                    padding: '14px 0',
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    transition: 'all 0.15s',
                                    marginBottom: 10,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = `0 4px 20px ${v.accentBg}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {v.primaryLabel}
                            </button>

                            {/* Secondary CTA */}
                            <button aria-label="Interactive Button"
                                onClick={handleLater}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.7)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 12,
                                    padding: '12px 0',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                    transition: 'all 0.15s',
                                    marginBottom: 14,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                }}
                            >
                                {v.secondaryLabel}
                            </button>

                            {/* Dismiss */}
                            <button aria-label="Interactive Button"
                                onClick={onDismiss}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.3)',
                                    border: 'none',
                                    padding: '8px 0',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, system-ui, sans-serif',
                                }}
                            >
                                {v.dismissLabel}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Success toast */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                            position: 'fixed',
                            bottom: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 12,
                            padding: '14px 22px',
                            backdropFilter: 'blur(20px)',
                            zIndex: 300,
                            minWidth: 280,
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ color: '#10b981', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {showToast.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {showToast.subtitle}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
