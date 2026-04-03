import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// SPONSOR CARD — Contextual sponsor injection for directory
//
// Surfaces: directory results, empty market states, corridor pages,
//           country pages, regulation pages, tool pages
//
// Rules per overlay:
//   - Ads must look premium and native
//   - Ads must be geo-aware, role-aware, and intent-aware
//   - Thin markets still monetize
//   - Sponsor scarcity must be real and visible
//   - Self-serve buy paths preferred
// ═══════════════════════════════════════════════════════════════

interface SponsorCardProps {
    zone: 'directory_top' | 'directory_inline' | 'empty_market' | 'corridor' |
          'country' | 'regulation' | 'tool' | 'blog' | 'glossary';
    geo?: string;           // Country or state code for targeting
    role?: string;          // User role for relevance
    intent?: string;        // User intent for contextual message
    compact?: boolean;      // Compact inline mode
    className?: string;
}

// Mock sponsor data — in production, this queries Supabase `sponsors` table
function getSponsorForZone(zone: string, geo?: string) {
    // TODO: Wire to Supabase sponsors table with geo targeting
    // For now, return a placeholder that drives to /advertise
    return null; // No sponsor yet → show claim CTA
}

export function SponsorCard({ zone, geo, role, intent, compact, className }: SponsorCardProps) {
    const sponsor = getSponsorForZone(zone, geo);

    if (sponsor) {
        // TODO: Render actual sponsor creative when sponsors are active
        return null;
    }

    // No sponsor for this zone → show "Advertise Here" CTA
    const geoLabel = geo ? ` in ${geo.toUpperCase()}` : '';
    const zoneLabels: Record<string, string> = {
        directory_top: 'directory results',
        directory_inline: 'search results',
        empty_market: 'this market',
        corridor: 'this corridor',
        country: 'this country',
        regulation: 'regulation pages',
        tool: 'this tool',
        blog: 'industry insights',
        glossary: 'glossary pages',
    };

    if (compact) {
        return (
            <Link
                href={`/advertise?zone=${zone}&geo=${geo || ''}`}
                className={className}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderRadius: 10,
                    background: 'rgba(212,168,67,0.04)',
                    border: '1px dashed rgba(212,168,67,0.15)',
                    textDecoration: 'none', color: '#9CA3AF',
                    fontSize: 11, fontWeight: 600,
                    transition: 'all 0.2s',
                }}
            >
                <span style={{ fontSize: 14 }}>💰</span>
                <span>Sponsor this {zoneLabels[zone] || 'section'}{geoLabel}</span>
                <span style={{
                    marginLeft: 'auto',
                    fontSize: 9, fontWeight: 800, padding: '2px 8px',
                    borderRadius: 4, background: 'rgba(212,168,67,0.08)',
                    color: '#D4A843', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    From $149/mo
                </span>
            </Link>
        );
    }

    return (
        <div
            className={className}
            style={{
                padding: 24, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(212,168,67,0.03), rgba(212,168,67,0.01))',
                border: '1px dashed rgba(212,168,67,0.15)',
                textAlign: 'center',
            }}
        >
            <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 12px',
                background: 'rgba(212,168,67,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
            }}>
                💰
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>
                Sponsor{geoLabel ? ` ${geo?.toUpperCase()}` : ` This ${zoneLabels[zone]?.charAt(0).toUpperCase()}${zoneLabels[zone]?.slice(1) || 'Zone'}`}
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
                Your brand at the top of {zoneLabels[zone] || 'this section'}{geoLabel}.
                Limited to 2 sponsors. Visible to every visitor.
            </div>
            <Link
                href={`/advertise?zone=${zone}&geo=${geo || ''}`}
                style={{
                    display: 'inline-flex', padding: '10px 24px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #D4A843, #d97706)',
                    color: '#000', fontWeight: 800, fontSize: 12, textDecoration: 'none',
                    letterSpacing: '0.02em',
                }}
            >
                Claim This Spot — From $149/mo →
            </Link>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// TRUST BADGE VARIANTS — Shield icons with color tiers
// ═══════════════════════════════════════════════════════════════

type TrustTier = 'bronze' | 'silver' | 'gold' | 'verified' | 'certified';

interface TrustBadgeProps {
    tier: TrustTier;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

const TRUST_COLORS: Record<TrustTier, { bg: string; border: string; text: string; icon: string }> = {
    bronze:    { bg: 'rgba(180,83,9,0.10)', border: 'rgba(180,83,9,0.25)', text: '#d97706', icon: '🛡️' },
    silver:    { bg: 'rgba(156,163,175,0.10)', border: 'rgba(156,163,175,0.25)', text: '#d1d5db', icon: '🛡️' },
    gold:      { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)', text: '#fbbf24', icon: '🛡️' },
    verified:  { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)', text: '#34d399', icon: '✅' },
    certified: { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa', icon: '🏆' },
};

const TRUST_SIZES: Record<string, { fontSize: number; padding: string; iconSize: number }> = {
    sm: { fontSize: 9, padding: '2px 8px', iconSize: 12 },
    md: { fontSize: 10, padding: '4px 12px', iconSize: 14 },
    lg: { fontSize: 12, padding: '6px 16px', iconSize: 16 },
};

export function TrustBadge({ tier, label, size = 'md' }: TrustBadgeProps) {
    const c = TRUST_COLORS[tier];
    const s = TRUST_SIZES[size];

    const defaultLabels: Record<TrustTier, string> = {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        verified: 'Verified',
        certified: 'Certified',
    };

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: s.padding, borderRadius: 6,
            background: c.bg, border: `1px solid ${c.border}`,
            fontSize: s.fontSize, fontWeight: 800,
            color: c.text, textTransform: 'uppercase',
            letterSpacing: '0.06em',
        }}>
            <span style={{ fontSize: s.iconSize }}>{c.icon}</span>
            {label || defaultLabels[tier]}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════
// DATA PRODUCT TEASER CARD
// preview + blur + unlock CTA
// ═══════════════════════════════════════════════════════════════

interface DataProductTeaserProps {
    title: string;
    description: string;
    previewData?: string[];      // 2-3 visible preview lines
    price: string;               // e.g. "$79/mo" or "$39 one-time"
    productSlug: string;
    locked?: boolean;
}

export function DataProductTeaser({ title, description, previewData, price, productSlug, locked = true }: DataProductTeaserProps) {
    return (
        <div style={{
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div>
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#f9fafb' }}>{title}</h3>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{description}</p>
                </div>
                <span style={{
                    fontSize: 16, fontWeight: 900, color: '#D4A843',
                    whiteSpace: 'nowrap',
                }}>{price}</span>
            </div>

            {/* Preview Data */}
            {previewData && previewData.length > 0 && (
                <div style={{ padding: '12px 20px', position: 'relative' }}>
                    {previewData.map((line, i) => (
                        <div key={i} style={{
                            fontSize: 12, color: '#9CA3AF', padding: '4px 0',
                            borderBottom: i < previewData.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        }}>
                            {line}
                        </div>
                    ))}
                    {/* Blur overlay for locked data */}
                    {locked && (
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
                            background: 'linear-gradient(transparent, rgba(11,11,12,0.95))',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            paddingBottom: 12,
                        }}>
                            <span style={{
                                fontSize: 10, fontWeight: 800, color: '#D4A843',
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                            }}>
                                🔒 Full data behind unlock
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* CTA */}
            <div style={{ padding: '12px 20px' }}>
                <Link
                    href={`/data?product=${productSlug}`}
                    style={{
                        display: 'block', padding: '10px 0', borderRadius: 10,
                        textAlign: 'center',
                        background: locked
                            ? 'linear-gradient(135deg, #D4A843, #d97706)'
                            : 'rgba(16,185,129,0.10)',
                        color: locked ? '#000' : '#34d399',
                        fontWeight: 800, fontSize: 12, textDecoration: 'none',
                    }}
                >
                    {locked ? `Unlock — ${price}` : '✓ Unlocked — View Full Data'}
                </Link>
            </div>
        </div>
    );
}
