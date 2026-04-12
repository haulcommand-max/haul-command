"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShieldCheck, ArrowRight, Zap, Star, Globe, TrendingUp } from "lucide-react";

const EscortBrokerInviteModal = dynamic(
    () => import("@/components/onboarding/EscortBrokerInviteModal"),
    { ssr: false }
);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Post-Claim Success â€” V2: Upsell Ladder
   Claim â†’ Invite Brokers â†’ Upgrade Path (Featured / Sponsor / Verified)
   Per Operating Brief: "no claim completion without a paid next step"
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ProfileApprovedInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const name = searchParams.get("name") ?? undefined;
    const [showInvite, setShowInvite] = useState(false);
    const [inviteDismissed, setInviteDismissed] = useState(false);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'slideUp 0.5s ease forwards',
            textAlign: 'center', padding: '0 20px',
        }}>
            {/* Success graphic */}
            <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
            }}>
                <ShieldCheck size={40} style={{ color: '#22C55E' }} />
            </div>

            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(212,168,68,0.1)',
                border: '1px solid rgba(212,168,68,0.2)',
                color: '#D4A844', fontSize: 12, fontWeight: 700,
                marginBottom: 16,
            }}>
                ðŸš€ Profile Live
            </div>

            <h1 style={{
                fontSize: 28, fontWeight: 900, color: '#f5f7fb',
                lineHeight: 1.1, margin: '0 0 8px',
            }}>
                {name ? `You're in, ${name}!` : "Your Profile is Live!"}
            </h1>

            <p style={{
                fontSize: 14, color: '#8fa3b8', maxWidth: 300,
                margin: '0 0 24px', lineHeight: 1.5,
            }}>
                Brokers can now find and book you on Haul Command. Build your trust score by inviting brokers and completing escorts.
            </p>

            {/* Invite CTA */}
            {!inviteDismissed && (
                <button aria-label="Interactive Button"
                    onClick={() => setShowInvite(true)}
                    style={{
                        width: '100%', maxWidth: 320,
                        padding: '14px 20px', borderRadius: 14,
                        background: 'var(--m-gold, #D4A844)',
                        color: '#0a0e17', fontSize: 15, fontWeight: 800,
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginBottom: 10,
                    }}
                >
                    ðŸš€ Invite My Brokers
                </button>
            )}

            <button aria-label="Interactive Button"
                onClick={() => router.push("/home")}
                style={{
                    background: 'transparent', border: 'none',
                    color: '#8fa3b8', fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 0',
                }}
            >
                {inviteDismissed ? "Go to Dashboard" : "Skip for now"}
                <ArrowRight size={16} />
            </button>

            {/* â•â•â• UPGRADE LADDER â•â•â• */}
            <div style={{
                width: '100%', maxWidth: 340,
                marginTop: 32, textAlign: 'left',
            }}>
                    <div style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: 'var(--m-gold, #D4A844)',
                        marginBottom: 16,
                    }}>
                        Upgrade Your Visibility
                    </div>

                    {/* Featured Boost */}
                    <Link aria-label="Navigation Link" href="/boost" style={{ textDecoration: 'none' }}>
                        <div style={{
                            padding: '16px 18px', borderRadius: 14, marginBottom: 10,
                            background: 'linear-gradient(135deg, rgba(212,168,68,0.08), rgba(212,168,68,0.02))',
                            border: '1px solid rgba(212,168,68,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Star size={20} style={{ color: '#D4A844', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#D4A844' }}>
                                        Featured Operator
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2 }}>
                                        2Ã— ranking boost + gold badge Â· $29/mo
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} style={{ color: '#6a7181', flexShrink: 0 }} />
                        </div>
                    </Link>

                    {/* Sponsor Territory */}
                    <Link aria-label="Navigation Link" href="/sponsor" style={{ textDecoration: 'none' }}>
                        <div style={{
                            padding: '16px 18px', borderRadius: 14, marginBottom: 10,
                            background: 'linear-gradient(135deg, rgba(20,184,166,0.06), rgba(20,184,166,0.02))',
                            border: '1px solid rgba(20,184,166,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Globe size={20} style={{ color: '#14B8A6', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#14B8A6' }}>
                                        Sponsor Your Territory
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2 }}>
                                        Own your city-level visibility Â· from $149/mo
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} style={{ color: '#6a7181', flexShrink: 0 }} />
                        </div>
                    </Link>

                    {/* Boost Profile */}
                    <Link aria-label="Navigation Link" href="/boost" style={{ textDecoration: 'none' }}>
                        <div style={{
                            padding: '16px 18px', borderRadius: 14, marginBottom: 10,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <TrendingUp size={20} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f5f7fb' }}>
                                        Boost Your Profile
                                    </div>
                                    <div style={{ fontSize: 11, color: '#8fa3b8', marginTop: 2 }}>
                                        7-day visibility surge Â· from $29
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} style={{ color: '#6a7181', flexShrink: 0 }} />
                        </div>
                    </Link>
                </div>

            {/* Stats strip */}
            <div style={{
                marginTop: 32, paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.06)',
                width: '100%', maxWidth: 300,
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 16, textAlign: 'center',
            }}>
                {[
                    { label: "Profile Status", value: "LIVE" },
                    { label: "Brokers Online", value: "Now" },
                    { label: "Jobs Available", value: "Open" },
                ].map((s) => (
                    <div key={s.label}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#D4A844' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: '#6a7181', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Invite modal */}
            {showInvite && (
                <EscortBrokerInviteModal
                    context="post_approval"
                    escortName={name}
                    onClose={() => {
                        setShowInvite(false);
                        setInviteDismissed(true);
                    }}
                />
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default function SuccessClient() {
    return <ProfileApprovedInner />;
}