'use client';

import React, { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

// ================================================================
// CLAIM WIZARD - Multi-Route Verification Component
// ================================================================

const T = {
    bg: '#060b12',
    bgCard: '#0f1720',
    bgOverlay: 'rgba(6,11,18,0.85)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    text: '#ffffff',
    textBody: '#cfd8e3',
    textSecondary: '#8fa3b8',
    textLabel: '#9fb3c8',
    gold: '#f5b942',
    blue: '#3ba4ff',
    green: '#27d17f',
    red: '#f87171',
    purple: '#a78bfa',
};

type WizardStep = 'select_route' | 'otp_entry' | 'dns_instructions' | 'token_instructions' | 'document_upload' | 'pending_review' | 'success' | 'error';

interface ClaimWizardProps {
    surfaceId: string;
    surfaceName: string;
    surfaceType: string;
    availableRoutes: string[];
    onClose: () => void;
    onClaimed?: () => void;
}

const ROUTE_INFO: Record<string, { label: string; icon: string; desc: string; time: string }> = {
    email_otp: { label: 'Email Verification', icon: 'E', desc: "We will send a 6-digit code to your email on file", time: '~1 min' },
    sms_otp: { label: 'Phone Verification', icon: 'P', desc: "We will send a 6-digit code via SMS", time: '~1 min' },
    dns: { label: 'DNS Verification', icon: 'D', desc: 'Add a TXT record to your domain DNS settings', time: '~24h' },
    website_token: { label: 'Website Verification', icon: 'W', desc: 'Add a meta tag or file to your website', time: '~24h' },
    document: { label: 'Document Verification', icon: 'F', desc: 'Upload a business license or utility bill', time: '1-3 days' },
    manual: { label: 'Manual Review', icon: 'M', desc: 'Submit for admin review', time: '1-5 days' },
};

export function ClaimWizard({ surfaceId, surfaceName, surfaceType, availableRoutes, onClose, onClaimed }: ClaimWizardProps) {
    const [step, setStep] = useState<WizardStep>('select_route');
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
    const [claimId, setClaimId] = useState<string | null>(null);
    const [nextStepMessage, setNextStepMessage] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const otpRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    const handleRouteSelect = useCallback(async (route: string) => {
        setLoading(true);
        setError(null);
        setSelectedRoute(route);

        try {
            const res = await fetch('/api/claims/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ surface_id: surfaceId, verification_route: route }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Failed to initiate claim');
                setStep('error');
                return;
            }

            setClaimId(data.claim_id);
            setNextStepMessage(data.next_step);

            if (route === 'email_otp' || route === 'sms_otp') setStep('otp_entry');
            else if (route === 'dns') setStep('dns_instructions');
            else if (route === 'website_token') setStep('token_instructions');
            else if (route === 'document') setStep('document_upload');
            else setStep('pending_review');
        } catch {
            setError('Network error. Please try again.');
            setStep('error');
        } finally {
            setLoading(false);
        }
    }, [surfaceId]);

    const handleOtpChange = useCallback((index: number, value: string) => {
        if (value.length > 1) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    }, [otp]);

    const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    }, [otp]);

    const handleVerifyOtp = useCallback(async () => {
        const code = otp.join('');
        if (code.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/claims/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_id: claimId, otp: code }),
            });
            const data = await res.json();

            if (data.success && data.status === 'approved') {
                setStep('success');
                onClaimed?.();
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, [otp, claimId, onClaimed]);

    const handleVerifyToken = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/claims/verify-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim_id: claimId }),
            });
            const data = await res.json();

            if (data.success) {
                setStep('pending_review');
                setNextStepMessage(data.next_step);
            } else {
                setError(data.error || 'Token verification failed');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, [claimId]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.bgOverlay, backdropFilter: 'blur(12px)',
        }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
                background: T.bgCard, border: `1px solid ${T.borderStrong}`,
                borderRadius: 20, padding: 0,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 24px 16px', borderBottom: `1px solid ${T.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.gold, marginBottom: 6 }}>
                            Claim Verification
                        </div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{surfaceName}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: T.textSecondary }}>
                            {surfaceType} &middot; Verify ownership to unlock edits, trust badge &amp; visibility
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`,
                        background: 'transparent', color: T.textSecondary, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>&times;</button>
                </div>

                <div style={{ padding: 24 }}>
                    {/* Route Selection */}
                    {step === 'select_route' && (
                        <>
                            <p style={{ margin: '0 0 16px', fontSize: 13, color: T.textBody }}>
                                Choose a verification method. Faster methods verify instantly.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {availableRoutes.map(route => {
                                    const info = ROUTE_INFO[route];
                                    if (!info) return null;
                                    return (
                                        <button
                                            key={route}
                                            onClick={() => handleRouteSelect(route)}
                                            disabled={loading}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 14,
                                                padding: '16px 18px', borderRadius: 14,
                                                background: T.bg, border: `1px solid ${T.border}`,
                                                color: T.text, cursor: 'pointer',
                                                textAlign: 'left', transition: 'all 0.15s',
                                            }}
                                        >
                                            <span style={{ fontSize: 20, width: 36, height: 36, borderRadius: 10, background: `${T.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: T.gold }}>{info.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700 }}>{info.label}</div>
                                                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>{info.desc}</div>
                                            </div>
                                            <span style={{
                                                fontSize: 10, fontWeight: 800, color: T.gold,
                                                background: `${T.gold}15`, padding: '4px 8px', borderRadius: 6,
                                            }}>{info.time}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* OTP Entry */}
                    {step === 'otp_entry' && (
                        <>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>
                                Enter Verification Code
                            </p>
                            <p style={{ margin: '0 0 20px', fontSize: 12, color: T.textSecondary }}>{nextStepMessage}</p>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { otpRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                        style={{
                                            width: 48, height: 56, textAlign: 'center',
                                            fontSize: 22, fontWeight: 900,
                                            background: T.bg, border: `2px solid ${digit ? T.gold : T.border}`,
                                            borderRadius: 12, color: T.text, outline: 'none',
                                            transition: 'border-color 0.15s',
                                        }}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={otp.join('').length !== 6 || loading}
                                style={{
                                    width: '100%', padding: '14px 0', borderRadius: 12,
                                    background: otp.join('').length === 6
                                        ? `linear-gradient(135deg, ${T.green}, #059669)`
                                        : T.bg,
                                    color: otp.join('').length === 6 ? '#fff' : T.textSecondary,
                                    border: 'none', fontSize: 14, fontWeight: 900,
                                    cursor: loading ? 'wait' : 'pointer',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>
                        </>
                    )}

                    {/* DNS Instructions */}
                    {step === 'dns_instructions' && (
                        <>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>
                                DNS Verification
                            </p>
                            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.textSecondary }}>
                                Add this TXT record to your domain&apos;s DNS settings:
                            </p>
                            <div style={{
                                padding: 16, borderRadius: 12, background: T.bg,
                                border: `1px solid ${T.border}`, fontFamily: 'monospace',
                                fontSize: 12, color: T.gold, wordBreak: 'break-all',
                                marginBottom: 20,
                            }}>
                                {nextStepMessage}
                            </div>
                            <button onClick={handleVerifyToken} disabled={loading} style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.blue}, #2563eb)`,
                                color: '#fff', border: 'none', fontSize: 14, fontWeight: 900,
                                cursor: loading ? 'wait' : 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {loading ? 'Checking...' : "I've Added the Record - Verify"}
                            </button>
                        </>
                    )}

                    {/* Website Token Instructions */}
                    {step === 'token_instructions' && (
                        <>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>
                                Website Token Verification
                            </p>
                            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.textSecondary }}>
                                Choose one of these methods:
                            </p>
                            <div style={{
                                padding: 16, borderRadius: 12, background: T.bg,
                                border: `1px solid ${T.border}`, fontFamily: 'monospace',
                                fontSize: 11, color: T.gold, wordBreak: 'break-all',
                                marginBottom: 20, lineHeight: 1.8,
                            }}>
                                {nextStepMessage}
                            </div>
                            <button onClick={handleVerifyToken} disabled={loading} style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.blue}, #2563eb)`,
                                color: '#fff', border: 'none', fontSize: 14, fontWeight: 900,
                                cursor: loading ? 'wait' : 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {loading ? 'Checking...' : "I've Added the Token - Verify"}
                            </button>
                        </>
                    )}

                    {/* Document Upload */}
                    {step === 'document_upload' && (
                        <>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: T.text }}>
                                Upload Proof of Ownership
                            </p>
                            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.textSecondary }}>
                                Upload a business license, utility bill, or other document proving your ownership.
                            </p>
                            <div style={{
                                padding: 40, borderRadius: 14, border: `2px dashed ${T.border}`,
                                textAlign: 'center', marginBottom: 20,
                                cursor: 'pointer', transition: 'border-color 0.15s',
                            }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>+</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.textBody }}>
                                    Drag &amp; drop or click to upload
                                </div>
                                <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 4 }}>
                                    PDF, JPG, PNG &middot; Max 10MB
                                </div>
                            </div>
                            <button onClick={() => setStep('pending_review')} style={{
                                width: '100%', padding: '14px 0', borderRadius: 12,
                                background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                                color: '#0a0f16', border: 'none', fontSize: 14, fontWeight: 900,
                                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                Submit for Review
                            </button>
                        </>
                    )}

                    {/* Pending Review */}
                    {step === 'pending_review' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.8 }}>...</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: T.text }}>
                                Under Review
                            </h3>
                            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>
                                {nextStepMessage || "Your claim is being reviewed. We will notify you when it is approved."}
                            </p>
                            <button onClick={onClose} style={{
                                padding: '12px 32px', borderRadius: 10,
                                background: T.bg, border: `1px solid ${T.border}`,
                                color: T.textBody, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            }}>
                                Close
                            </button>
                        </div>
                    )}

                    {/* Success */}
                    {step === 'success' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: `${T.green}20`, border: `2px solid ${T.green}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 16px', fontSize: 28,
                            }}>&#10003;</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: T.green }}>
                                Verified!
                            </h3>
                            <p style={{ margin: '0 0 8px', fontSize: 14, color: T.textBody }}>
                                You now own <strong>{surfaceName}</strong>
                            </p>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
                                margin: '16px 0 24px',
                            }}>
                                {['Edit Listing', 'Trust Badge', 'Visibility Boost', 'Lead Routing'].map(perk => (
                                    <span key={perk} style={{
                                        padding: '5px 12px', borderRadius: 8,
                                        background: `${T.green}12`, border: `1px solid ${T.green}30`,
                                        color: T.green, fontSize: 11, fontWeight: 700,
                                    }}>{perk}</span>
                                ))}
                            </div>
                            <button onClick={onClose} style={{
                                padding: '12px 32px', borderRadius: 10,
                                background: `linear-gradient(135deg, ${T.green}, #059669)`,
                                color: '#fff', fontSize: 13, fontWeight: 900, border: 'none',
                                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                Go to My Listing
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {step === 'error' && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: T.red }}>
                                Something Went Wrong
                            </h3>
                            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textSecondary }}>{error}</p>
                            <button onClick={() => { setStep('select_route'); setError(null); }} style={{
                                padding: '12px 32px', borderRadius: 10,
                                background: T.bg, border: `1px solid ${T.border}`,
                                color: T.textBody, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            }}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Error toast */}
                    {error && step !== 'error' && (
                        <div style={{
                            marginTop: 12, padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
                            color: T.red, fontSize: 12, fontWeight: 600,
                        }}>{error}</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Claim Card (For Surface Pages & Search Results)

interface ClaimCardProps {
    surfaceId: string;
    surfaceName: string;
    surfaceType: string;
    availableRoutes: string[];
}

export function ClaimCard({ surfaceId, surfaceName, surfaceType, availableRoutes }: ClaimCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div style={{
                padding: 18, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(245,185,66,0.08), rgba(245,185,66,0.02))',
                border: '1px solid rgba(245,185,66,0.2)',
            }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.gold, marginBottom: 4 }}>
                    Own this listing?
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
                    Verify in 60 seconds and unlock edits, trust badge, and visibility.
                </p>
                <button onClick={() => setOpen(true)} style={{
                    padding: '10px 20px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                    color: '#0a0f16', fontSize: 12, fontWeight: 900, border: 'none',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                    Claim Now
                </button>
            </div>

            {open && (
                <ClaimWizard
                    surfaceId={surfaceId}
                    surfaceName={surfaceName}
                    surfaceType={surfaceType}
                    availableRoutes={availableRoutes}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

export default ClaimWizard;
