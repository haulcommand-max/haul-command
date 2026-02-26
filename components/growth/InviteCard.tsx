'use client';

import React, { useState } from 'react';
import { Share2, Zap, MessageSquare, Mail, Copy, Check } from 'lucide-react';

interface InviteCardProps {
    referralCode?: string;
    onInvite?: (channel: 'sms' | 'email' | 'copy') => void;
}

export default function InviteCard({ referralCode = 'BOOST-100X', onInvite }: InviteCardProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${referralCode}` : `https://haulcommand.com/join/${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        if (onInvite) onInvite('copy');
    };

    const handleSMS = () => {
        const text = encodeURIComponent(`Skip the line on Haul Command. Use my code ${referralCode} to get priority load matching. ${shareUrl}`);
        window.open(`sms:?body=${text}`, '_self');
        if (onInvite) onInvite('sms');
    };

    const handleEmail = () => {
        const subject = encodeURIComponent('Join Haul Command (Priority Access)');
        const body = encodeURIComponent(`Skip the line on Haul Command.\n\nUse my invite link to get priority load matching:\n${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
        if (onInvite) onInvite('email');
    };

    return (
        <div style={{
            position: 'relative',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.2)', // Amber subtle border
            borderRadius: 16,
            padding: 24,
            overflow: 'hidden',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
        }}>
            {/* Liquid Gradient Glow Background */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                        <Zap size={20} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' }} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                            Match Priority Boost
                        </h3>
                        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
                            Both you and your invitee get +20% algorithm priority for 30 days.
                        </p>
                    </div>
                </div>

                {/* Referral Code Display */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20
                }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em' }}>
                        {referralCode}
                    </div>
                    <button 
                        onClick={handleCopy}
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: copied ? '#22c55e' : '#64748b',
                            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
                            transition: 'color 0.2s'
                        }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied' : 'Copy Link'}
                    </button>
                </div>

                {/* Quick Share Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleSMS} style={actionButtonStyle}>
                        <MessageSquare size={18} color="#e2e8f0" />
                        <span>Text Invite</span>
                    </button>
                    <button onClick={handleEmail} style={actionButtonStyle}>
                        <Mail size={18} color="#e2e8f0" />
                        <span>Email Invite</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

const actionButtonStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 0',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // Hover effects will be handled by CSS classes in production, using inline styles for logic demonstration
};
