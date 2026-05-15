'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DirectorySearchBar } from '@/components/ui/DirectorySearchBar';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { stateFullName } from '@/lib/geo/state-names';
import { Shield, MapPin, Star } from 'lucide-react';

/**
 * DirectoryGrid — Client component that wraps operator cards with search/filter.
 * Receives hydrated operator data from the server component.
 */

interface DirectoryGridProps {
  providers: any[];
  targetCountry: string;
}

// Common US states for filter dropdown. Do not show this in global / non-US
// directory mode because it makes the page look US-only.
const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
].map(code => ({ code, name: stateFullName(code) || code }));

function providerLocation(p: any, targetCountry: string): string {
  const state = stateFullName(p.state_inferred, true) || p.state_inferred || p.state_code;
  const country = p.country_code_inferred || p.country_code || (targetCountry !== 'GLOBAL' ? targetCountry : '');
  return [p.city, state, country].filter(Boolean).join(', ');
}

export function DirectoryGrid({ providers, targetCountry }: DirectoryGridProps) {
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const displayItems = filtered ?? providers;
  const isUsMode = targetCountry === 'US';

  return (
    <>
      <DirectorySearchBar
        items={providers}
        onFilter={setFiltered}
        placeholder="Search company, city, state/province, role, service, or support type..."
        stateOptions={isUsMode ? STATE_OPTIONS : undefined}
        searchFields={['company', 'name', 'company_name', 'city', 'state_inferred', 'state_code', 'country_code_inferred', 'primary_service_area', 'source']}
      />

      {/* Results count */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, padding: '0 4px',
      }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
          {displayItems.length} support record{displayItems.length !== 1 ? 's' : ''} shown
          {filtered !== null && filtered.length !== providers.length && (
            <span style={{ color: '#C6923A' }}> (filtered from {providers.length})</span>
          )}
        </span>
        <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
          {targetCountry === 'GLOBAL' ? 'Global directory mode' : `${targetCountry} directory mode`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayItems.length > 0 ? displayItems.map((p: any) => {
          const location = providerLocation(p, targetCountry);
          const profileSignal = p.confidence_score || 0;
          const hasHighSignal = profileSignal > 80;

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
              {hasHighSignal && (
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
                      fontSize: 18, fontWeight: 800, color: '#0056B3',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      margin: '0 0 4px',
                    }}>
                      {p.company || p.name || 'Listed Support Record'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 14, height: 14, color: '#6B7280' }} />
                      <span style={{ fontSize: 13, color: '#4B5563', fontWeight: 500 }}>
                        {location || 'Location pending'}
                      </span>
                      {p.last_seen_at && <FreshnessBadge lastSeenAt={p.last_seen_at} />}
                    </div>
                  </div>

                  {/* Profile signal score */}
                  {profileSignal > 0 && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 8, flexShrink: 0,
                      background: hasHighSignal ? '#FEF9C3' : '#F3F4F6',
                      border: `1px solid ${hasHighSignal ? '#FDE047' : '#E5E7EB'}`,
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: hasHighSignal ? '#854D0E' : '#4B5563' }}>
                        {profileSignal}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Signal
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
                  {p.confidence_tier && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100,
                      background: '#FFFBEB', border: '1px solid #FDE68A',
                      color: '#92400E',
                    }}>
                      {p.confidence_tier}
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
                    background: '#0F52BA',
                    color: '#ffffff', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                  className="hover:bg-[#0c4296]"
                >
                  <MapPin style={{ width: 14, height: 14 }} />
                  Request Match
                </Link>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full" style={{
            padding: 32, border: '1px solid #E5E7EB',
            borderRadius: 20, textAlign: 'left', background: '#F9FAFB',
          }}>
            <p style={{ color: '#6B7280', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              No support records match this search yet.
            </p>
            <h3 style={{ color: '#111827', fontWeight: 900, fontSize: 22, marginTop: 8 }}>
              Turn this empty result into a support packet, claim path, or market signal.
            </h3>
            <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.65, marginTop: 8, maxWidth: 760 }}>
              Haul Command should not dead-end when a role, route, city, or country is thin. Use the search as a demand signal: request help, suggest a provider, become the first verified support option, or sponsor the gap for buyers searching this moment.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/loads" className="rounded-lg bg-[#0F52BA] px-4 py-2 text-sm font-bold text-white hover:bg-[#0c4296]">
                Build support packet
              </Link>
              <Link href="/claim" className="rounded-lg border border-[#C6923A] bg-[#FFFBEB] px-4 py-2 text-sm font-bold text-[#854D0E] hover:bg-[#FEF3C7]">
                Claim or add profile
              </Link>
              <Link href="/contact?intent=suggest-provider" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100">
                Suggest provider
              </Link>
              <Link href="/advertise/buy?zone=directory_gap" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-100">
                Sponsor this gap
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
