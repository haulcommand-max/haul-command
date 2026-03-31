'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MobileScreenHeader,
  MobileSearch,
  MobileList,
  MobileEmpty,
} from '@/components/mobile/MobileComponents';

/* ══════════════════════════════════════════════════════════════
   Mobile Directory — V2: Real Data + Claimed/Unclaimed
   Sources: /api/directory/resolve (per-entity) and initial list
   from directory_listings via /api/directory/search
   ══════════════════════════════════════════════════════════════ */

interface DirectoryListing {
  id: string;
  slug: string;
  name: string;
  city: string;
  region_code: string;
  country_code: string;
  is_claimed: boolean;
  rank_score: number;
  completeness: number;
}

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--m-gold)" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function getTrustColor(score: number) {
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#F59E0B';
  if (score > 0) return '#6B7280';
  return 'var(--m-text-muted)';
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function MobileDirectory() {
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/directory/listings?limit=30');
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings ?? []);
          setTotal(data.total ?? null);
        }
      } catch { /* use empty state */ }
      setLoading(false);
    }
    fetchListings();
  }, []);

  // Client-side filter on fetched listings
  const filtered = search
    ? listings.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.city?.toLowerCase().includes(search.toLowerCase()) ||
        l.region_code?.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      <MobileScreenHeader title="Directory" />

      {/* Search */}
      <div style={{ paddingTop: 'var(--m-md)' }}>
        <MobileSearch
          placeholder="Search operators..."
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Total count proof bar */}
      {total !== null && (
        <div style={{
          padding: 'var(--m-sm) var(--m-screen-pad)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22C55E', flexShrink: 0,
          }} />
          <span style={{
            fontSize: 'var(--m-font-caption)',
            color: 'var(--m-text-secondary)',
            fontWeight: 600,
          }}>
            {total.toLocaleString()} operators in directory
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--m-3xl) 0', color: 'var(--m-text-muted)',
        }}>
          Loading directory...
        </div>
      )}

      {/* Operator Cards */}
      {!loading && filtered.length === 0 ? (
        <MobileEmpty
          title="No operators found"
          description={search ? 'Try a different search term' : 'Directory is loading'}
        />
      ) : !loading && (
        <MobileList>
          {filtered.map((listing, i) => (
            <Link aria-label="Navigation Link"
              key={listing.id}
              href={`/place/${listing.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="m-card m-animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div style={{ display: 'flex', gap: 'var(--m-md)' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--m-radius-full)',
                    background: listing.is_claimed
                      ? 'rgba(212,168,68,0.1)'
                      : 'var(--m-surface-raised)',
                    border: listing.is_claimed
                      ? '2px solid var(--m-gold)'
                      : '2px solid var(--m-border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 14, fontWeight: 700,
                    color: listing.is_claimed ? 'var(--m-gold-text, #D4A844)' : 'var(--m-text-muted)',
                  }}>
                    {getInitials(listing.name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--m-xs)' }}>
                      <span style={{
                        fontSize: 'var(--m-font-h3)', fontWeight: 600,
                        color: 'var(--m-text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {listing.name}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-secondary)',
                      marginTop: 2,
                    }}>
                      {[listing.city, listing.region_code].filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Claimed / Unclaimed Badge + Trust Score */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginTop: 'var(--m-md)',
                  paddingTop: 'var(--m-sm)',
                  borderTop: '1px solid var(--m-border-subtle)',
                }}>
                  {/* Claimed status */}
                  {listing.is_claimed ? (
                    <span style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.02em',
                      color: '#22C55E',
                      background: 'rgba(34,197,94,0.1)',
                      padding: '3px 8px', borderRadius: 4,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      ✓ Claimed
                    </span>
                  ) : (
                    <Link aria-label="Navigation Link" href={`/claim?eq=${listing.slug}`} onClick={e => e.stopPropagation()} style={{
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.02em',
                      color: 'var(--m-gold-text, #D4A844)',
                      background: 'rgba(212,168,68,0.08)',
                      padding: '3px 8px', borderRadius: 4,
                      textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      Claim this profile →
                    </Link>
                  )}

                  {/* Rank score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {listing.rank_score > 0 && (
                      <>
                        <StarIcon />
                        <span style={{
                          fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
                          color: getTrustColor(listing.rank_score),
                        }}>
                          {listing.rank_score}
                        </span>
                      </>
                    )}
                    {listing.completeness >= 80 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: '#22C55E',
                        background: 'rgba(34,197,94,0.1)', padding: '2px 6px',
                        borderRadius: 4, marginLeft: 2,
                      }}>
                        Complete ✓
                      </span>
                    )}
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
