'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MobileScreenHeader,
  MobileCard,
  MobileSearch,
  MobileChip,
  MobileList,
  MobileEmpty,
} from '@/components/mobile/MobileComponents';

/* ══════════════════════════════════════════════════════════════
   Mobile Directory — Frame 6 (Provider List)
   Search bar, location chip, provider cards with trust scores
   Approved spec: 390px, card-based, no tables
   ══════════════════════════════════════════════════════════════ */

interface Provider {
  id: string;
  name: string;
  location: string;
  distance: string;
  trustScore: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  tags: string[];
  avatar?: string;
}

const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'p1', name: 'Texas Wide Load Escorts', location: 'Houston, TX',
    distance: '12 mi', trustScore: 92, rating: 4.8, reviewCount: 127,
    verified: true, tags: ['Oversize', 'Wide Load', 'Super Load'],
  },
  {
    id: 'p2', name: 'Lone Star Pilot Cars', location: 'Dallas, TX',
    distance: '28 mi', trustScore: 88, rating: 4.6, reviewCount: 89,
    verified: true, tags: ['Oversize', 'Route Survey'],
  },
  {
    id: 'p3', name: 'Plains Escort Services', location: 'Oklahoma City, OK',
    distance: '45 mi', trustScore: 75, rating: 4.3, reviewCount: 42,
    verified: false, tags: ['Wide Load', 'Height Pole'],
  },
  {
    id: 'p4', name: 'Heartland Heavy Haul', location: 'San Antonio, TX',
    distance: '62 mi', trustScore: 85, rating: 4.5, reviewCount: 68,
    verified: true, tags: ['Oversize', 'Super Load', 'Crane'],
  },
];

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--m-gold)" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function getTrustColor(score: number) {
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#F59E0B';
  return '#6B7280';
}

export default function MobileDirectory() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_PROVIDERS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      <MobileScreenHeader title="Directory" />

      {/* Search */}
      <div style={{ paddingTop: 'var(--m-md)' }}>
        <MobileSearch
          placeholder="Search operators..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Location chip */}
      <div style={{ padding: 'var(--m-md) var(--m-screen-pad)' }}>
        <span className="m-chip m-chip--tag" style={{
          borderColor: 'rgba(212,168,68,0.25)',
          color: 'var(--m-gold-text)',
        }}>
          📍 Near Houston, TX
        </span>
      </div>

      {/* Provider Cards */}
      {filtered.length === 0 ? (
        <MobileEmpty
          title="No operators found"
          description="Try a different search or location"
        />
      ) : (
        <MobileList>
          {filtered.map((provider, i) => (
            <Link
              key={provider.id}
              href={`/place/${provider.id}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="m-card m-animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div style={{ display: 'flex', gap: 'var(--m-md)' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--m-radius-full)',
                    background: 'var(--m-surface-raised)',
                    border: provider.verified ? '2px solid var(--m-gold)' : '2px solid var(--m-border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 18,
                  }}>
                    {provider.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-xs)' }}>
                      <span style={{
                        fontSize: 'var(--m-font-h3)', fontWeight: 600,
                        color: 'var(--m-text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {provider.name}
                      </span>
                    </div>

                    <div style={{
                      fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
                      marginTop: 2,
                    }}>
                      {provider.location} · {provider.distance}
                    </div>
                  </div>
                </div>

                {/* Trust Score Bar */}
                <div style={{ marginTop: 'var(--m-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)' }}>
                      Trust Score
                    </span>
                    <span style={{
                      fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
                      color: getTrustColor(provider.trustScore),
                    }}>
                      {provider.trustScore}/100
                    </span>
                  </div>
                  <div style={{
                    height: 4, borderRadius: 2, background: 'var(--m-border-subtle)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${provider.trustScore}%`,
                      background: getTrustColor(provider.trustScore),
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Tags + Rating Row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 'var(--m-md)',
                  paddingTop: 'var(--m-md)',
                  borderTop: '1px solid var(--m-border-subtle)',
                }}>
                  <div style={{ display: 'flex', gap: 'var(--m-xs)', flexWrap: 'wrap', flex: 1 }}>
                    {provider.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="m-chip m-chip--tag" style={{
                        fontSize: 9, padding: '2px 6px',
                      }}>
                        {tag}
                      </span>
                    ))}
                    {provider.tags.length > 2 && (
                      <span style={{ fontSize: 'var(--m-font-overline)', color: 'var(--m-text-muted)' }}>
                        +{provider.tags.length - 2}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {provider.verified && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#22C55E',
                        background: 'rgba(34,197,94,0.1)', padding: '2px 6px',
                        borderRadius: 4, marginRight: 4,
                      }}>
                        Verified ✓
                      </span>
                    )}
                    <StarIcon />
                    <span style={{
                      fontSize: 'var(--m-font-body-sm)', fontWeight: 700, color: 'var(--m-gold)',
                    }}>
                      {provider.rating}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </MobileList>
      )}

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}
