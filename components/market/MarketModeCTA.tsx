import Link from 'next/link';
import {
  getMarketModeConfig,
  type MarketModeConfig,
} from '@/lib/ads/market-mode';

// ═══════════════════════════════════════════════════════════════
// MARKET MODE CTA — Server Component
//
// Renders the appropriate CTA based on the country's market mode:
//   live    → "Find Operators" → /directory
//   seed    → "Join Waitlist" + "Claim Profile" → /claim
//   dormant → "Get Notified" → /alerts
//
// This ensures NO page is a dead end — every country has
// a next step, even if the marketplace isn't active yet.
// ═══════════════════════════════════════════════════════════════

interface MarketModeCTAProps {
  countryCode: string;
  countryName: string;
  localTerm: string;       // e.g. "pilot car", "escort vehicle", "Begleitfahrzeug"
  className?: string;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function MarketModeCTA({
  countryCode,
  countryName,
  localTerm,
  className = '',
}: MarketModeCTAProps) {
  const config: MarketModeConfig = getMarketModeConfig(countryCode);
  const capTerm = cap(localTerm);

  // ── LIVE: Full marketplace CTA ──
  if (config.cta_type === 'full_marketplace') {
    return (
      <div className={className} style={{
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, rgba(212,168,67,0.08), rgba(212,168,67,0.02))',
        border: '1px solid rgba(212,168,67,0.15)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.25rem' }}>
            Need a {localTerm} in {countryName}?
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>
            Find verified operators in our directory — instant availability, reviews, and dispatch.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href={`/directory?country=${countryCode}`}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              background: '#D4A843',
              color: '#0B0B0C',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Find {capTerm} Operators →
          </Link>
          <Link
            href={`/claim?country=${countryCode}`}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#D1D5DB',
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Claim Your Profile
          </Link>
        </div>
      </div>
    );
  }

  // ── SEED: Waitlist + Claim ──
  if (config.cta_type === 'claim_waitlist') {
    return (
      <div className={className} style={{
        padding: '1.5rem 2rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))',
        border: '1px solid rgba(59,130,246,0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            padding: '0.125rem 0.625rem',
            borderRadius: '9999px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            fontSize: '0.625rem',
            fontWeight: 800,
            color: '#60A5FA',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.75rem',
          }}>
            🌱 Market Seeding — {countryName}
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.25rem' }}>
            Be the first {localTerm} listed in {countryName}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
            We&apos;re building the {countryName} marketplace. Claim your profile now to get first-mover advantage — early operators rank highest.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href={`/claim?country=${countryCode}`}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Claim Your Profile →
          </Link>
          <Link
            href={`/alerts/subscribe?country=${countryCode}&type=market_launch`}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#D1D5DB',
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Get Notified When Live
          </Link>
        </div>
        {config.no_dead_end_behavior.show_global_feed && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
            <Link
              href="/directory"
              style={{ fontSize: '0.8125rem', color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}
            >
              Browse global directory while {countryName} builds →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── DORMANT: Notify Me ──
  return (
    <div className={className} style={{
      padding: '1.5rem 2rem',
      borderRadius: '0.75rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div>
        <div style={{
          display: 'inline-flex',
          padding: '0.125rem 0.625rem',
          borderRadius: '9999px',
          background: 'rgba(107,114,128,0.1)',
          border: '1px solid rgba(107,114,128,0.2)',
          fontSize: '0.625rem',
          fontWeight: 800,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.75rem',
        }}>
          Coming Soon — {countryName}
        </div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.25rem' }}>
          {capTerm} services in {countryName} coming soon
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
          Get notified when the {countryName} marketplace launches. Be the first to list.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link
          href={`/alerts/subscribe?country=${countryCode}&type=market_launch`}
          style={{
            padding: '0.625rem 1.5rem',
            borderRadius: '0.5rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#F3F4F6',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          🔔 Notify Me When Live
        </Link>
        {config.no_dead_end_behavior.show_sponsor_interest_capture && (
          <Link
            href={`/sponsor?country=${countryCode}`}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              background: 'rgba(212,168,67,0.06)',
              border: '1px solid rgba(212,168,67,0.15)',
              color: '#D4A843',
              fontWeight: 600,
              fontSize: '0.8125rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Become a Launch Sponsor
          </Link>
        )}
      </div>
      {config.no_dead_end_behavior.show_global_feed && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
          <Link
            href="/directory"
            style={{ fontSize: '0.8125rem', color: '#9CA3AF', textDecoration: 'none', fontWeight: 500 }}
          >
            Browse operators in other countries →
          </Link>
        </div>
      )}
    </div>
  );
}
