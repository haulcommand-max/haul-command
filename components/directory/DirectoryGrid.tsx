'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { DirectorySearchBar } from '@/components/ui/DirectorySearchBar';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { stateFullName } from '@/lib/geo/state-names';
import { Shield, MapPin, Star, ChevronRight } from 'lucide-react';

/**
 * DirectoryGrid — Client component that wraps operator cards with search/filter.
 * Receives hydrated operator data from the server component.
 */

interface DirectoryGridProps {
  providers: any[];
  targetCountry: string;
}

// Common US states for filter dropdown
const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
].map(code => ({ code, name: stateFullName(code) || code }));

export function DirectoryGrid({ providers, targetCountry }: DirectoryGridProps) {
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const displayItems = filtered ?? providers;

  return (
    <>
      <DirectorySearchBar
        items={providers}
        onFilter={setFiltered}
        placeholder="Search by operator name, city, or state..."
        stateOptions={STATE_OPTIONS}
      />

      {/* Results count */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, padding: '0 4px',
      }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          {displayItems.length} operator{displayItems.length !== 1 ? 's' : ''} found
          {filtered !== null && filtered.length !== providers.length && (
            <span style={{ color: '#C6923A' }}> (filtered from {providers.length})</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayItems.length > 0 ? displayItems.map((p: any) => {
          const state = stateFullName(p.state_inferred, true);
          const trust = p.confidence_score || 0;
          const hasHighTrust = trust > 80;

          return (
            <div
              key={p.contact_id}
              style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 12, padding: '20px 20px 16px',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
              className="hover:border-gray-300 hover:shadow-md group"
            >
              {hasHighTrust && (
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                  background: '#FACC15', opacity: 0.15, borderRadius: '50%', filter: 'blur(24px)',
                  pointerEvents: 'none',
                }} />
              )}

              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 18, fontWeight: 800, color: '#0056B3', // YP style blue header
                      letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      margin: '0 0 4px',
                    }}>
                      {p.company || p.name || 'Verified Operator'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 14, height: 14, color: '#6B7280' }} />
                      <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 500 }}>
                        {p.city ? `${p.city}, ` : ''}{state}
                      </span>
                      <FreshnessBadge lastSeenAt={p.last_seen_at || new Date().toISOString()} />
                    </div>
                  </div>

                  {/* Trust score */}
                  {trust > 0 && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 8, flexShrink: 0,
                      background: hasHighTrust ? '#FEF9C3' : '#F3F4F6', // light yellow or gray
                      border: `1px solid ${hasHighTrust ? '#FDE047' : '#E5E7EB'}`,
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: hasHighTrust ? '#854D0E' : '#4B5563' }}>
                        {trust}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Trust
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {p.equipment_types && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                      background: '#EFF6FF', border: '1px solid #BFDBFE',
                      color: '#1D4ED8', textTransform: 'capitalize',
                    }}>
                      {typeof p.equipment_types === 'string' ? p.equipment_types.split(',')[0]?.trim() : 'Escort'}
                    </span>
                  )}
                  {p.verification_status === 'verified' && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                      background: '#F0FDF4', border: '1px solid #BBF7D0',
                      color: '#15803D', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Shield style={{ width: 12, height: 12 }} /> Verified
                    </span>
                  )}
                  {p.rating_avg && Number(p.rating_avg) > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                      background: '#F9FAFB', border: '1px solid #E5E7EB',
                      color: '#374151', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Star style={{ width: 12, height: 12, color: '#EAB308' }} /> {Number(p.rating_avg).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/directory/dossier/${p.contact_id}`}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, textAlign: 'center',
                    background: '#F3F4F6', border: '1px solid #D1D5DB',
                    color: '#374151', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  className="hover:bg-gray-200"
                >
                  View Profile
                </Link>
                <Link
                  href={`/auth/signup?intent=dispatch&target=${p.contact_id}`}
                  style={{
                    flex: 1.2, padding: '10px 0', borderRadius: 8, textAlign: 'center',
                    background: '#0F52BA', // Strong YP CTA Blue
                    color: '#ffffff', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  className="hover:bg-[#0c4296]"
                >
                  <MapPin style={{ width: 14, height: 14 }} />
                  Live Ping
                </Link>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full" style={{
            padding: 48, border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20, textAlign: 'center', background: '#111214',
          }}>
            <p style={{ color: '#9CA3AF', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              No operators match your search.
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
              Try broadening your search or clearing filters.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
