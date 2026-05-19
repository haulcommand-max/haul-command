import Link from 'next/link';

//
// DIRECTORY SPONSOR CARD - Injected between directory results.
// Keeps sponsor placement clearly labeled and avoids fake rank, availability,
// or verification claims.
//

interface DirectorySponsorCardProps {
  position: 'upper' | 'lower';
  stateCode?: string;
  countryCode?: string;
}

const COPY: Record<string, { headline: string; body: string; cta: string; marker: string }> = {
  upper: {
    headline: 'Be the labeled sponsor beside this market search',
    body: 'Reach buyers comparing pilot cars, permit help, staging, repair, and route support in this territory. Placement is labeled and cannot manufacture rank, availability, or verification.',
    cta: 'Sponsor this market',
    marker: 'AD',
  },
  lower: {
    headline: 'Put your offer next to real support intent',
    body: 'Launch labeled directory placement for eligible searches instead of buying generic traffic. Buyers stay in a proof-aware workflow.',
    cta: 'Launch placement',
    marker: 'SP',
  },
};

export default function DirectorySponsorCard({ position, stateCode, countryCode }: DirectorySponsorCardProps) {
  const copy = COPY[position];
  const marketQuery = new URLSearchParams();
  if (stateCode) marketQuery.set('state', stateCode);
  if (countryCode) marketQuery.set('country', countryCode);
  const query = marketQuery.toString();
  const href = position === 'upper'
    ? `/advertise/territory${query ? `?${query}` : ''}`
    : `/advertise/buy${query ? `?${query}` : ''}`;

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
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: 'rgba(212,168,67,0.10)',
        border: '1px solid rgba(212,168,67,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 900,
        color: '#D4A843',
        flexShrink: 0,
        letterSpacing: '0.08em',
      }}>
        {copy.marker}
      </div>

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
        {copy.cta}
      </Link>
    </div>
  );
}
