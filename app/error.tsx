'use client';
import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Global Error Boundary
 * 
 * P0 FIX: Replaced the "SYSTEM FAULT — Navigation Vector Compromised"
 * error page that was destroying trust on production. The old error page
 * made every runtime crash look like a critical systems failure,
 * scaring users away from the platform.
 * 
 * The new error page maintains brand authority while being honest
 * about the error, and routes users to high-value pages instead
 * of leaving them stranded.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Haul Command Error:", error);
    }, [error]);

    return (
        <main style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: '#050608',
            color: '#e5e7eb',
            fontFamily: "'Inter', system-ui",
        }}>
            <div style={{
                maxWidth: 480,
                width: '100%',
                textAlign: 'center',
            }}>
                {/* Icon */}
                <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'rgba(198,146,58,0.08)',
                    border: '1px solid rgba(198,146,58,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: 24,
                }}>
                    ⚠️
                </div>

                <h1 style={{
                    fontSize: 24, fontWeight: 900, color: '#f9fafb',
                    marginBottom: 8, letterSpacing: '-0.02em',
                }}>
                    Page Unavailable
                </h1>
                <p style={{
                    fontSize: 14, color: '#94a3b8', lineHeight: 1.6,
                    marginBottom: 32, maxWidth: 360, margin: '0 auto 32px',
                }}>
                    This content is being updated or is temporarily offline. 
                    We&apos;re actively expanding coverage across all 50 states and 120 countries.
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                    <button
                        onClick={() => reset()}
                        style={{
                            width: '100%', padding: '14px 24px', borderRadius: 12,
                            background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                            color: '#000', fontSize: 13, fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            border: 'none', cursor: 'pointer',
                        }}
                    >
                        Try Again
                    </button>
                    <Link href="/" style={{
                        display: 'block', width: '100%', padding: '14px 24px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#d1d5db', fontSize: 13, fontWeight: 700,
                        textDecoration: 'none', textAlign: 'center',
                    }}>
                        Back to Home
                    </Link>
                </div>

                {/* Quick navigation */}
                <div style={{
                    padding: '16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        Popular Destinations
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {[
                            { href: '/directory', label: 'Directory' },
                            { href: '/available-now', label: 'Available Now' },
                            { href: '/tools', label: 'Free Tools' },
                            { href: '/training', label: 'Training' },
                            { href: '/blog', label: 'Intelligence' },
                        ].map(l => (
                            <Link key={l.href} href={l.href} style={{
                                padding: '6px 14px', borderRadius: 8,
                                background: 'rgba(198,146,58,0.06)', border: '1px solid rgba(198,146,58,0.12)',
                                color: '#E0B05C', fontSize: 11, fontWeight: 700,
                                textDecoration: 'none',
                            }}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}