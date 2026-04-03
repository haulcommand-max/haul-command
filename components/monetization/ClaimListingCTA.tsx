import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// CLAIM YOUR LISTING — Supply-side Conversion Component
//
// Role: pilot_car_operator + support_partner
// Intent: claim + grow_business + build_trust
//
// Surfaces: operator profile cards, directory results, unclaimed
//           listing pages, empty market states, sidebar panels
//
// Flow: See unclaimed listing → Click claim → Auth gate →
//       Verify identity → Upgrade profile → Enter payment tier
//
// This is the PRIMARY supply-side conversion path.
// Every unclaimed listing is a monetization opportunity.
// ═══════════════════════════════════════════════════════════════

interface ClaimListingCTAProps {
    operatorName?: string;
    city?: string;
    state?: string;
    listingId?: string;
    variant: 'inline' | 'card' | 'banner' | 'minimal';
    claimedCount?: number;     // Social proof: X operators claimed this week
    totalUnclaimed?: number;   // Scarcity: X still unclaimed in this area
}

export function ClaimListingCTA({
    operatorName,
    city,
    state,
    listingId,
    variant = 'card',
    claimedCount,
    totalUnclaimed,
}: ClaimListingCTAProps) {
    const claimUrl = listingId
        ? `/claim?listing=${listingId}`
        : `/claim${state ? `?state=${state}` : ''}`;

    const geoLabel = city && state ? `${city}, ${state}` : state || '';

    if (variant === 'minimal') {
        return (
            <Link
                href={claimUrl}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 700, color: '#D4A843',
                    textDecoration: 'none',
                }}
            >
                <span style={{ fontSize: 13 }}>🔓</span>
                Claim this listing
            </Link>
        );
    }

    if (variant === 'inline') {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(212,168,67,0.04)',
                border: '1px dashed rgba(212,168,67,0.15)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🔓</span>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb' }}>
                            {operatorName ? `Is this your business?` : 'Unclaimed listing'}
                        </div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>
                            Claim to update info, respond to leads, and unlock analytics
                        </div>
                    </div>
                </div>
                <Link href={claimUrl} style={{
                    padding: '6px 16px', borderRadius: 8, fontSize: 11, fontWeight: 800,
                    background: 'linear-gradient(135deg, #D4A843, #d97706)',
                    color: '#000', textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                    Claim Now
                </Link>
            </div>
        );
    }

    if (variant === 'banner') {
        return (
            <div style={{
                padding: '16px 24px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(212,168,67,0.06), rgba(212,168,67,0.02))',
                border: '1px solid rgba(212,168,67,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                        {operatorName
                            ? `${operatorName} — Is this your business?`
                            : `Claim your listing${geoLabel ? ` in ${geoLabel}` : ''}`}
                    </div>
                    <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
                        Verified operators get priority placement, lead alerts, analytics, and trust badges.
                        {claimedCount && claimedCount > 0 && (
                            <span style={{ color: '#D4A843', fontWeight: 700 }}> {claimedCount} operators claimed this week.</span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href={claimUrl} style={{
                        padding: '12px 28px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                        background: 'linear-gradient(135deg, #D4A843, #d97706)',
                        color: '#000', textDecoration: 'none', whiteSpace: 'nowrap',
                    }}>
                        Claim Your Listing →
                    </Link>
                </div>
            </div>
        );
    }

    // variant === 'card' (default)
    return (
        <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            {/* Gold accent */}
            <div style={{
                height: 3,
                background: 'linear-gradient(90deg, #D4A843, #d97706, transparent)',
            }} />

            <div style={{ padding: 24 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, marginBottom: 16,
                    background: 'rgba(212,168,67,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                }}>
                    🔓
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 4, margin: 0 }}>
                    Claim Your Listing
                </h3>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 1.5, margin: '4px 0 16px' }}>
                    {operatorName
                        ? `${operatorName} is listed on Haul Command but hasn't been claimed yet.`
                        : `Unclaimed listings${geoLabel ? ` in ${geoLabel}` : ''} are missing out on leads.`}
                </p>

                {/* Benefits */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                        'Update your business information',
                        'Respond directly to broker inquiries',
                        'Unlock analytics dashboard',
                        'Earn a verified trust badge',
                        'Get priority in search results',
                    ].map((b, i) => (
                        <li key={i} style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#10b981', fontSize: 10 }}>✓</span> {b}
                        </li>
                    ))}
                </ul>

                {/* Social proof */}
                {(claimedCount || totalUnclaimed) && (
                    <div style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 16,
                        background: 'rgba(212,168,67,0.04)',
                        fontSize: 11, color: '#D4A843', fontWeight: 600,
                    }}>
                        {claimedCount && claimedCount > 0 && `${claimedCount} operators claimed this week`}
                        {claimedCount && totalUnclaimed && ' · '}
                        {totalUnclaimed && totalUnclaimed > 0 && `${totalUnclaimed} unclaimed in this area`}
                    </div>
                )}

                {/* CTA */}
                <Link href={claimUrl} style={{
                    display: 'block', padding: '12px 0', borderRadius: 10,
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #D4A843, #d97706)',
                    color: '#000', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                }}>
                    Claim Your Listing — Free →
                </Link>

                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 10, color: '#6b7280' }}>
                    Free to claim · Pro features from $29/mo
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// UNCLAIMED BADGE — Visual indicator on profile cards
// Shows that a listing hasn't been claimed yet
// ═══════════════════════════════════════════════════════════════

export function UnclaimedBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: size === 'sm' ? '2px 6px' : '3px 10px',
            borderRadius: 6, fontSize: size === 'sm' ? 8 : 9,
            fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'rgba(107,114,128,0.10)',
            border: '1px solid rgba(107,114,128,0.20)',
            color: '#6b7280',
        }}>
            🔓 Unclaimed
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════
// CLAIMED BADGE — Shows verified/claimed status
// ═══════════════════════════════════════════════════════════════

export function ClaimedBadge({ tier = 'verified', size = 'md' }: {
    tier?: 'claimed' | 'verified' | 'pro' | 'elite';
    size?: 'sm' | 'md';
}) {
    const config = {
        claimed:  { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', color: '#34d399', icon: '✅', label: 'Claimed' },
        verified: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', color: '#60a5fa', icon: '🛡️', label: 'Verified' },
        pro:      { bg: 'rgba(212,168,67,0.10)', border: 'rgba(212,168,67,0.25)', color: '#D4A843', icon: '⭐', label: 'Pro' },
        elite:    { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)', color: '#a78bfa', icon: '👑', label: 'Elite' },
    };
    const c = config[tier];

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: size === 'sm' ? '2px 6px' : '3px 10px',
            borderRadius: 6, fontSize: size === 'sm' ? 8 : 9,
            fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: c.bg, border: `1px solid ${c.border}`, color: c.color,
        }}>
            {c.icon} {c.label}
        </span>
    );
}
