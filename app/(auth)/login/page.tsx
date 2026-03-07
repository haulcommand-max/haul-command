"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState("");
    const [sent, setSent] = useState(false);
    const router = useRouter();
    const supabase = supabaseBrowser();

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        setLoading(false);
        if (error) alert(error.message);
        else setSent(true);
    };

    const handleOAuth = async (provider: 'google' | 'github' | 'linkedin_oidc') => {
        setOauthLoading(provider);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
                queryParams: provider === 'google' ? { prompt: 'select_account' } : {},
            },
        });
        if (error) {
            alert(error.message);
            setOauthLoading("");
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #030712 0%, #0B1120 50%, #030712 100%)',
            fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)",
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: 420,
                background: 'rgba(15,15,25,0.9)',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 20,
                padding: '2.5rem 2rem',
                backdropFilter: 'blur(16px)',
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.25em',
                        color: '#F59E0B',
                        marginBottom: 8,
                    }}>HAUL COMMAND</div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#F9FAFB',
                    }}>Welcome Back</h1>
                    <p style={{
                        margin: '6px 0 0',
                        fontSize: '0.85rem',
                        color: '#9CA3AF',
                    }}>Sign in to manage your dispatch & fleet</p>
                </div>

                {/* Social OAuth */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => handleOAuth('google')}
                        disabled={!!oauthLoading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            padding: '12px 16px',
                            background: '#fff',
                            border: 'none',
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            cursor: 'pointer',
                            opacity: oauthLoading === 'google' ? 0.6 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.99 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09A6.97 6.97 0 0 1 5.48 12c0-.72.13-1.43.36-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
                    </button>

                    <button
                        onClick={() => handleOAuth('github')}
                        disabled={!!oauthLoading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#e0e0e0',
                            cursor: 'pointer',
                            opacity: oauthLoading === 'github' ? 0.6 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                        {oauthLoading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
                    </button>

                    <button
                        onClick={() => handleOAuth('linkedin_oidc')}
                        disabled={!!oauthLoading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 10,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#e0e0e0',
                            cursor: 'pointer',
                            opacity: oauthLoading === 'linkedin_oidc' ? 0.6 : 1,
                            transition: 'all 0.15s',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        {oauthLoading === 'linkedin_oidc' ? 'Redirecting...' : 'Continue with LinkedIn'}
                    </button>
                </div>

                {/* Divider */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    margin: '1.25rem 0',
                }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Magic Link */}
                {sent ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: 'rgba(16,185,129,0.08)',
                        borderRadius: 12,
                        border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📬</div>
                        <p style={{ color: '#10B981', fontWeight: 600, margin: '0 0 4px' }}>Check your email</p>
                        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
                            We sent a magic link to <strong style={{ color: '#e0e0e0' }}>{email}</strong>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 10,
                                color: '#F9FAFB',
                                fontSize: '0.9rem',
                                outline: 'none',
                                transition: 'border-color 0.15s',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 16px',
                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                border: 'none',
                                borderRadius: 10,
                                color: '#030712',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                opacity: loading ? 0.6 : 1,
                                transition: 'all 0.15s',
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Magic Link ✨'}
                        </button>
                    </form>
                )}

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                    lineHeight: 1.5,
                }}>
                    By continuing, you agree to HAUL COMMAND's{' '}
                    <a href="/legal/terms" style={{ color: '#F59E0B', textDecoration: 'none' }}>Terms</a> and{' '}
                    <a href="/legal/privacy" style={{ color: '#F59E0B', textDecoration: 'none' }}>Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
