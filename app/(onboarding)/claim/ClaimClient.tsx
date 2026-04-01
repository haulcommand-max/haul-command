"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { BackButton } from "../components/BackButton";
import { Lock, Phone, Loader2, Shield, Clock, CheckCircle } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   ClaimClient — Premium Claim Flow (Mobile-First)
   P1: Upgraded from acceptable to premium trust surface.
   - Stronger hierarchy with HC gold accent
   - Trust signals (verified badge, time-to-complete)
   - Better contrast on all text elements
   - Clear progress expectation
   ══════════════════════════════════════════════════════════════ */

function ClaimPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eq = searchParams.get("eq");
    const regions = searchParams.get("regions");

    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = supabaseBrowser();

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (phone.length < 10) {
            setError("Please enter a valid phone number");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });

            if (error) throw error;

            router.push(`/verify?eq=${eq}&regions=${regions}&phone=${encodeURIComponent(phone)}`);
        } catch (err: any) {
            setError(err.message || "Failed to send code");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.5s ease forwards',
        }}>
            <BackButton />

            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                {/* Gold lock icon */}
                <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(198, 146, 58, 0.15)',
                    border: '2px solid rgba(198, 146, 58, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                }}>
                    <Lock size={28} style={{ color: 'var(--hc-gold-400, #D4A844)' }} />
                </div>

                <h1 style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#f5f7fb',
                    lineHeight: 1.1,
                    margin: '0 0 8px',
                }}>
                    Claim Your Profile
                </h1>
                <p style={{
                    fontSize: 14,
                    color: '#c7ccd7',
                    lineHeight: 1.5,
                    margin: 0,
                }}>
                    Verify your phone to unlock your operator dashboard, respond to loads, and build your trust score.
                </p>
            </div>

            {/* Trust signals row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
                marginBottom: 28,
            }}>
                {[
                    { icon: Shield, label: 'Verified', desc: 'Badge' },
                    { icon: Clock, label: '< 2 min', desc: 'To verify' },
                    { icon: CheckCircle, label: 'Free', desc: 'to claim' },
                ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} style={{
                        textAlign: 'center',
                        padding: '12px 8px',
                        borderRadius: 14,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}>
                        <Icon size={16} style={{ color: 'var(--hc-gold-400, #D4A844)', marginBottom: 4 }} />
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#f5f7fb' }}>{label}</div>
                        <div style={{ fontSize: 10, color: '#8f97a7', marginTop: 2 }}>{desc}</div>
                    </div>
                ))}
            </div>

            {/* Phone form */}
            <form onSubmit={handleClaim} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#8f97a7',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginLeft: 4,
                }}>
                    Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#8f97a7',
                    }}>
                        <Phone size={18} />
                    </div>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1.5px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 14,
                            padding: '16px 16px 16px 48px',
                            fontSize: 16,
                            color: '#f5f7fb',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {error && (
                    <div style={{
                        color: '#f87171',
                        fontSize: 13,
                        background: 'rgba(239, 68, 68, 0.08)',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        marginTop: 8,
                        background: 'linear-gradient(135deg, var(--hc-gold-400, #D4A844), #f1c27b)',
                        color: '#060b12',
                        fontWeight: 800,
                        fontSize: 16,
                        borderRadius: 14,
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 24px rgba(198, 146, 58, 0.25)',
                    }}
                >
                    {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Verification Code'}
                </button>

                <p style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#6b7280',
                    marginTop: 8,
                }}>
                    By continuing you agree to receive SMS for verification. Msg rates may apply.
                </p>
            </form>

            {/* What happens next */}
            <div style={{
                marginTop: 32,
                padding: '16px 18px',
                borderRadius: 16,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
                <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--hc-gold-400, #D4A844)',
                    marginBottom: 10,
                }}>
                    What happens next
                </div>
                {[
                    'Enter your code to verify your number',
                    'Your operator profile activates instantly',
                    'Start responding to loads and building trust',
                ].map((step, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                        <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'rgba(198, 146, 58, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'var(--hc-gold-400, #D4A844)',
                            flexShrink: 0,
                        }}>
                            {i + 1}
                        </div>
                        <div style={{ fontSize: 13, color: '#c7ccd7', lineHeight: 1.4 }}>{step}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ClaimClient() {
    return (
        <Suspense fallback={
            <div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100vh' }} />
        }>
            <ClaimPageInner />
        </Suspense>
    );
}
