/**
 * SponsoredBadge — FTC/CMA compliant advertising disclosure component.
 * Required on ALL boosted/paid directory listings to comply with:
 * - FTC Endorsement Guides (US)
 * - CMA transparency rules (UK)  
 * - EU Digital Services Act (DSA) Article 26
 * 
 * Usage:
 *   <SponsoredBadge type="boost" />      // AdGrid boost
 *   <SponsoredBadge type="featured" />    // Featured listing
 *   <SponsoredBadge type="territory" />   // Territory sponsor
 */

interface SponsoredBadgeProps {
    type?: 'boost' | 'featured' | 'territory' | 'sponsor';
    size?: 'sm' | 'md';
}

const LABELS: Record<string, string> = {
    boost: 'Ad',
    featured: 'Featured',
    territory: 'Sponsor',
    sponsor: 'Sponsored',
};

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
    boost: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
    featured: { bg: 'rgba(59, 130, 246, 0.08)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.2)' },
    territory: { bg: 'rgba(168, 85, 247, 0.08)', text: '#A855F7', border: 'rgba(168, 85, 247, 0.2)' },
    sponsor: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
};

export function SponsoredBadge({ type = 'sponsor', size = 'sm' }: SponsoredBadgeProps) {
    const label = LABELS[type] || 'Sponsored';
    const color = COLORS[type] || COLORS.sponsor;
    const fontSize = size === 'sm' ? 9 : 11;
    const padding = size === 'sm' ? '2px 6px' : '3px 8px';

    return (
        <span
            aria-label={`This listing is a paid ${label.toLowerCase()} placement`}
            title={`Paid ${label.toLowerCase()} placement`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: color.text,
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: 4,
                padding,
                lineHeight: 1,
                userSelect: 'none',
            }}
        >
            {label}
        </span>
    );
}
