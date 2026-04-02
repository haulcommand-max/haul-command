'use client';

import { useState, useEffect } from 'react';

/**
 * CookieConsent — GDPR/ePrivacy Directive compliant cookie consent banner.
 * Required for all EU/EEA users across 20+ countries in the 120-country network.
 * 
 * Behavior:
 * - Shows on first visit if no consent stored
 * - Stores preference in localStorage + cookie
 * - Blocks analytics/tracking cookies until consent
 * - Provides granular choices (essential, analytics, marketing)
 * - "Accept All" and "Reject Non-Essential" options
 */

const CONSENT_KEY = 'hc_cookie_consent';
const CONSENT_VERSION = '2026-04-02'; // Bump when policy changes

interface ConsentState {
    essential: boolean;    // Always true — auth, session
    analytics: boolean;    // PostHog, Vercel Analytics
    marketing: boolean;    // Future ad tracking
    version: string;
    timestamp: string;
}

export function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [consent, setConsent] = useState<ConsentState>({
        essential: true,
        analytics: false,
        marketing: false,
        version: CONSENT_VERSION,
        timestamp: '',
    });

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_KEY);
            if (stored) {
                const parsed: ConsentState = JSON.parse(stored);
                // Reshow if consent version changed
                if (parsed.version !== CONSENT_VERSION) {
                    setVisible(true);
                } else {
                    setConsent(parsed);
                    applyConsent(parsed);
                }
            } else {
                setVisible(true);
            }
        } catch {
            setVisible(true);
        }
    }, []);

    function applyConsent(c: ConsentState) {
        // Set cookie for server-side reading (middleware, API routes)
        document.cookie = `hc_consent=${c.analytics ? 'full' : 'essential'};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax;Secure`;

        // Enable/disable PostHog based on analytics consent
        if (typeof window !== 'undefined' && (window as any).posthog) {
            if (c.analytics) {
                (window as any).posthog.opt_in_capturing();
            } else {
                (window as any).posthog.opt_out_capturing();
            }
        }
    }

    function saveConsent(c: ConsentState) {
        const finalConsent = { ...c, timestamp: new Date().toISOString() };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(finalConsent));
        applyConsent(finalConsent);
        setConsent(finalConsent);
        setVisible(false);
    }

    function acceptAll() {
        saveConsent({ essential: true, analytics: true, marketing: true, version: CONSENT_VERSION, timestamp: '' });
    }

    function rejectNonEssential() {
        saveConsent({ essential: true, analytics: false, marketing: false, version: CONSENT_VERSION, timestamp: '' });
    }

    function saveCustom() {
        saveConsent(consent);
    }

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 99999,
                background: 'rgba(3, 7, 18, 0.97)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                padding: '20px 16px',
                fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
            }}
        >
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                        <p style={{ color: '#F9FAFB', fontSize: 14, fontWeight: 600, margin: '0 0 6px' }}>
                            🍪 We use cookies
                        </p>
                        <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                            We use essential cookies for authentication and platform security. With your consent, we also use analytics cookies
                            (PostHog, Vercel Analytics) to improve the platform. We never sell your data.{' '}
                            <a href="/legal/privacy" style={{ color: '#F59E0B', textDecoration: 'underline' }}>Privacy Policy</a>
                        </p>

                        {showDetails && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                                    <input type="checkbox" checked disabled style={{ accentColor: '#22C55E' }} />
                                    <span><strong>Essential</strong> — Authentication, security, session management (always on)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                                    <input
                                        type="checkbox"
                                        checked={consent.analytics}
                                        onChange={e => setConsent(p => ({ ...p, analytics: e.target.checked }))}
                                        style={{ accentColor: '#3B82F6' }}
                                    />
                                    <span><strong>Analytics</strong> — PostHog, Vercel Analytics (helps us improve the platform)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D1D5DB' }}>
                                    <input
                                        type="checkbox"
                                        checked={consent.marketing}
                                        onChange={e => setConsent(p => ({ ...p, marketing: e.target.checked }))}
                                        style={{ accentColor: '#F59E0B' }}
                                    />
                                    <span><strong>Marketing</strong> — Ad performance measurement (not currently active)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#9CA3AF',
                                fontSize: 13,
                                padding: '8px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                            }}
                        >
                            {showDetails ? 'Hide Details' : 'Customize'}
                        </button>
                        {showDetails && (
                            <button
                                onClick={saveCustom}
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#F9FAFB',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    padding: '8px 16px',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                }}
                            >
                                Save Preferences
                            </button>
                        )}
                        <button
                            onClick={rejectNonEssential}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: '#D1D5DB',
                                fontSize: 13,
                                fontWeight: 500,
                                padding: '8px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                            }}
                        >
                            Reject Non-Essential
                        </button>
                        <button
                            onClick={acceptAll}
                            style={{
                                background: '#F59E0B',
                                border: 'none',
                                color: '#000',
                                fontSize: 13,
                                fontWeight: 700,
                                padding: '8px 20px',
                                borderRadius: 8,
                                cursor: 'pointer',
                            }}
                        >
                            Accept All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
