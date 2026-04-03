import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// DIRECTORY SPONSOR CARD — Injected between directory results
//
// Shows empty-market sponsor inventory or live sponsor creative.
// Positions: After result #3 and #10 in the operator listing.
//
// Design: Distinguished from organic results with gold border +
// "Sponsored" label for FTC compliance. Links to /advertise.
// ═══════════════════════════════════════════════════════════════

interface DirectorySponsorCardProps {
  position: 'upper' | 'lower';
  stateCode?: string;
  countryCode?: string;
}

const COPY: Record<string, { headline: string; body: string; cta: string }> = {
  upper: {
    headline: 'Your Business Here',
    body: 'Reach operators and brokers searching in this territory. Exclusive sponsor placement with verified audience — not general traffic.',
    cta: 'Become a Territory Sponsor',
  },
  lower: {
    headline: 'Want more visibility?',
    body: 'Self-serve CPC campaigns start at $0.75/click. Or claim an exclusive corridor sponsorship. Industry-only traffic.',
    cta: 'Launch a Campaign',
  },
};

export default function DirectorySponsorCard({ position, stateCode, countryCode }: DirectorySponsorCardProps) {
  const copy = COPY[position];
  const href = position === 'upper'
    ? `/advertise/territory${stateCode ? `?state=${stateCode}` : ''}`
    : '/advertise/buy';

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(212,168,67,0.20)',
        background: 'linear-gradient(135deg, rgba(212,168,67,0.04) 0%, rgba(11,11,12,1) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Sponsor icon */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'rgba(212,168,67,0.10)',
        border: '1px solid rgba(212,168,67,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        flexShrink: 0,
      }}>
        {position === 'upper' ? '🗺️' : '⚡'}
      </div>

      {/* Copy */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            padding: '1px 6px',
            borderRadius: 4,
            background: 'rgba(212,168,67,0.12)',
            color: '#D4A843',
            border: '1px solid rgba(212,168,67,0.20)',
          }}>
            Sponsored
          </span>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E5E7EB', margin: 0 }}>
            {copy.headline}
          </h3>
        </div>
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
          {copy.body}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={href}
        style={{
          flexShrink: 0,
          padding: '0.5rem 1rem',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 11,
          background: 'rgba(212,168,67,0.12)',
          border: '1px solid rgba(212,168,67,0.25)',
          color: '#D4A843',
          textDecoration: 'none',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap' as const,
          transition: 'all 0.2s ease',
        }}
      >
        {copy.cta} →
      </Link>
    </div>
  );
}
