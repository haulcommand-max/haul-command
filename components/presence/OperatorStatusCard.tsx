'use client';

/**
 * OPERATOR STATUS CARD — Presence UI Surface #1
 * One-tap availability toggle with freshness timer + pressure nudges.
 * Copy: direct, operational, high-trust tone.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────

type PresenceStatus = 'available_now' | 'available_soon' | 'on_job' | 'offline';

interface OperatorStatusCardProps {
    currentStatus: PresenceStatus;
    lastCheckInMinutes: number;
    nearbyDemand?: boolean;
    idleHours?: number;
    onStatusChange: (status: PresenceStatus) => void;
    className?: string;
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PresenceStatus, {
    icon: string;
    label: string;
    helper: string;
    color: string;
    bg: string;
    border: string;
    glow: string;
}> = {
    available_now: {
        icon: '🟢',
        label: 'available now',
        helper: 'you are visible for immediate loads',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)',
        glow: '0 0 20px rgba(16,185,129,0.15)',
    },
    available_soon: {
        icon: '🟡',
        label: 'available later',
        helper: "you'll still appear in upcoming searches",
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        glow: '0 0 20px rgba(245,158,11,0.12)',
    },
    on_job: {
        icon: '🔵',
        label: 'on a job',
        helper: 'this builds trust with brokers',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.25)',
        glow: '0 0 20px rgba(59,130,246,0.12)',
    },
    offline: {
        icon: '⚫',
        label: 'offline',
        helper: 'urgent loads may skip your profile',
        color: '#6b7280',
        bg: 'rgba(107,114,128,0.08)',
        border: 'rgba(107,114,128,0.25)',
        glow: 'none',
    },
};

// ── Freshness formatter ──────────────────────────────────────────────────────

function formatFreshness(minutes: number): string {
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours ago`;
    return `${Math.round(minutes / 1440)} days ago`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OperatorStatusCard({
    currentStatus,
    lastCheckInMinutes,
    nearbyDemand,
    idleHours,
    onStatusChange,
    className,
}: OperatorStatusCardProps) {
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState({ title: '', subtitle: '' });
    const config = STATUS_CONFIG[currentStatus];

    const handleStatusChange = useCallback((status: PresenceStatus) => {
        onStatusChange(status);

        if (status === 'available_now') {
            setToastMsg({ title: "you're live", subtitle: 'brokers can now see you for nearby loads' });
        } else if (status === 'available_soon') {
            setToastMsg({ title: 'availability updated', subtitle: "you'll appear in upcoming searches" });
        } else if (status === 'on_job') {
            setToastMsg({ title: 'status updated', subtitle: 'brokers know you\'re currently working' });
        } else {
            setToastMsg({ title: 'offline', subtitle: 'you won\'t appear in urgent searches' });
        }
        setShowToast(true);
    }, [onStatusChange]);

    useEffect(() => {
        if (showToast) {
            const t = setTimeout(() => setShowToast(false), 3500);
            return () => clearTimeout(t);
        }
    }, [showToast]);

    // Determine nudge
    let nudge: { copy: string; type: string } | null = null;
    if (currentStatus === 'offline' && nearbyDemand) {
        nudge = { copy: 'brokers are active in your area — check in to stay visible', type: 'demand' };
    } else if ((idleHours ?? 0) >= 48) {
        nudge = { copy: 'inactive operators may drop in local search', type: 'decay' };
    } else if (nearbyDemand && currentStatus !== 'available_now') {
        nudge = { copy: 'demand is building near your usual routes', type: 'corridor' };
    }

    return (
        <div className={className} style={{
            background: 'rgba(15,15,20,0.85)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: '24px',
            backdropFilter: 'blur(20px)',
        }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    your status
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '4px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    keep this current so brokers know when to call
                </p>
            </div>

            {/* Current status indicator */}
            <motion.div
                layout
                style={{
                    background: config.bg,
                    border: `1px solid ${config.border}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    marginBottom: 16,
                    boxShadow: config.glow,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{config.icon}</span>
                        <div>
                            <div style={{ color: config.color, fontSize: 15, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                {config.label}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                {config.helper}
                            </div>
                        </div>
                    </div>
                    {/* Freshness timer */}
                    <div style={{
                        color: lastCheckInMinutes < 60 ? 'rgba(16,185,129,0.8)' : 'rgba(255,255,255,0.35)',
                        fontSize: 11,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textAlign: 'right',
                    }}>
                        <div style={{ opacity: 0.6, marginBottom: 2 }}>last check-in</div>
                        <div style={{ fontWeight: 500 }}>{formatFreshness(lastCheckInMinutes)}</div>
                    </div>
                </div>
            </motion.div>

            {/* Pressure nudge */}
            <AnimatePresence>
                {nudge && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: 10,
                            padding: '10px 14px',
                            marginBottom: 16,
                        }}
                    >
                        <p style={{ color: 'rgba(245,158,11,0.9)', fontSize: 12, margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {nudge.copy}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentStatus !== 'available_now' && (
                    <button aria-label="Interactive Button"
                        onClick={() => handleStatusChange('available_now')}
                        style={{
                            background: 'rgba(16,185,129,0.12)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 10,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(16,185,129,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(16,185,129,0.12)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <span style={{ color: '#10b981', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            go available now
                        </span>
                        <span style={{ color: 'rgba(16,185,129,0.6)', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            one tap — shows you first nearby
                        </span>
                    </button>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                    {currentStatus !== 'available_soon' && (
                        <button aria-label="Interactive Button"
                            onClick={() => handleStatusChange('available_soon')}
                            style={{
                                flex: 1,
                                background: 'rgba(245,158,11,0.06)',
                                border: '1px solid rgba(245,158,11,0.15)',
                                borderRadius: 10,
                                padding: '10px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(245,158,11,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(245,158,11,0.06)';
                            }}
                        >
                            <div style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                set availability later
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                choose when you&apos;ll be free
                            </div>
                        </button>
                    )}

                    {currentStatus !== 'on_job' && (
                        <button aria-label="Interactive Button"
                            onClick={() => handleStatusChange('on_job')}
                            style={{
                                flex: 1,
                                background: 'rgba(59,130,246,0.06)',
                                border: '1px solid rgba(59,130,246,0.15)',
                                borderRadius: 10,
                                padding: '10px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.12)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                            }}
                        >
                            <div style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                mark on job
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                                lets brokers know you&apos;re working
                            </div>
                        </button>
                    )}
                </div>
            </div>

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
                            padding: '14px 20px',
                            backdropFilter: 'blur(20px)',
                            zIndex: 100,
                            minWidth: 280,
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ color: '#10b981', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {toastMsg.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4, fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {toastMsg.subtitle}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
