'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DirectorySearchBar } from '@/components/ui/DirectorySearchBar';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import EmptyMarketState from '@/components/directory/EmptyMarketState';
import { stateFullName } from '@/lib/geo/state-names';
import {
  buildDirectoryIntentLanes,
  getDirectoryEntityLabel,
  getDirectoryProofState,
  getDirectorySupportAttributes,
} from '@/lib/directory/presentation';
import { buildDirectoryCardCopy } from '@/lib/directory/conversion-copy';
import { track } from '@/lib/analytics/track';
import { ClipboardList, MapPin, Route, Shield, Star } from 'lucide-react';
import type { DirectoryFilterState } from '@/components/ui/DirectorySearchBar';

/**
 * DirectoryGrid — Client component that wraps operator cards with search/filter.
 * Receives hydrated operator data from the server component.
 */

interface DirectoryGridProps {
  providers: any[];
  targetCountry: string;
  initialFilters?: Partial<DirectoryFilterState>;
  dataIssue?: string | null;
}

// Common US states for filter dropdown
const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
].map(code => ({ code, name: stateFullName(code) || code }));

export function DirectoryGrid({ providers, targetCountry, initialFilters, dataIssue }: DirectoryGridProps) {
  const [filtered, setFiltered] = useState<any[] | null>(null);
  const displayItems = filtered ?? providers;
  const intentLanes = buildDirectoryIntentLanes(targetCountry);

  function getRecordId(record: any): string {
    return String(record.contact_id || record.id || record.entity_id || record.slug || record.company || record.name || '');
  }

  function getDisplayName(record: any): string {
    return record.company_name || record.company || record.display_name || record.name || record.full_name || 'Indexed support record';
  }

  function hasContactSignal(record: any): boolean {
    return Boolean(record.contact_available || record.phone || record.phone_number || record.phone_e164 || record.phone_raw || record.website || record.email);
  }

  function getClaimLine(record: any, proofLabel: string, proofStrength: number): string {
    const status = String(record.claim_status || record.owner_claim_status || record.profile_claim_status || '').toLowerCase();
    return buildDirectoryCardCopy({
      proofLabel,
      proofStrength,
      isClaimed: ['claimed', 'approved', 'owner_verified'].includes(status) || Boolean(record.claimed_at || record.owner_user_id),
      hasContactSignal: hasContactSignal(record),
    }).proofLine;
  }

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {intentLanes.map((lane) => (
          <Link
            key={lane.label}
            href={lane.href}
            onClick={() => track.event('directory_intent_lane_click', { lane: lane.label, country_code: targetCountry })}
            className="group rounded-xl border border-white/10 bg-black/35 p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-[2px] transition-colors hover:border-[#C6923A]/60 hover:bg-[#C6923A]/10"
          >
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Route className="h-4 w-4 text-[#C6923A]" />
              {lane.label}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#d8c6a3]">{lane.body}</p>
          </Link>
        ))}
      </div>

      <DirectorySearchBar
        items={providers}
        onFilter={setFiltered}
        placeholder="Search company, city, parking, repair, permit, route support..."
        stateOptions={STATE_OPTIONS}
        surface="command"
        initialFilters={initialFilters}
      />

      <div className="mb-4 flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#d8c6a3]">
          {displayItems.length} source-backed record{displayItems.length !== 1 ? 's' : ''} found. Narrow by proof, contact path, or claim state
          {filtered !== null && filtered.length !== providers.length && (
            <span className="text-[#C6923A]"> (filtered from {providers.length})</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayItems.length > 0 ? displayItems.map((p: any) => {
          const recordId = getRecordId(p);
          const state = stateFullName(p.state_inferred || p.state, true) || p.state_inferred || p.state || '';
          const city = p.city_inferred || p.city || p.home_base_city || '';
          const profileSignal = Math.round(Number(p.rank_score ?? p.trust_score ?? p.confidence_score ?? 0));
          const hasHighSignal = profileSignal > 80;
          const entityLabel = getDirectoryEntityLabel(p);
          const proof = getDirectoryProofState(p);
          const attributes = getDirectorySupportAttributes(p);
          const displayName = getDisplayName(p);
          const contactSignal = hasContactSignal(p);
          const hasRealRating = Number(p.rating_avg) > 0 && Number(p.review_count ?? p.reviews_count ?? 0) > 0;
          const cardCopy = buildDirectoryCardCopy({
            proofLabel: proof.label,
            proofStrength: proof.strength,
            isClaimed: Boolean(p.claimed_at || p.owner_user_id || ['claimed', 'approved', 'owner_verified'].includes(String(p.claim_status || p.owner_claim_status || p.profile_claim_status || '').toLowerCase())),
            hasContactSignal: contactSignal,
          });
          const profileHref = recordId ? `/directory/dossier/${encodeURIComponent(recordId)}` : '/directory';
          const packetHref = recordId
            ? `/load-board/post?support=${encodeURIComponent(recordId)}&country=${encodeURIComponent(targetCountry)}`
            : `/load-board/post?country=${encodeURIComponent(targetCountry)}`;
          const claimHref = recordId
            ? `/claim?operator=${encodeURIComponent(recordId)}`
            : `/claim?country=${encodeURIComponent(targetCountry)}`;

          return (
            <div
              key={recordId || displayName}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-[2px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C6923A]/55 hover:shadow-[0_24px_80px_rgba(0,0,0,0.36)]"
            >
              {hasHighSignal && (
                <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[#C6923A]/20 blur-3xl" />
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                        color: '#d8c6a3', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {entityLabel}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: proof.strength >= 4 ? 'rgba(34,197,94,0.12)' : proof.strength >= 2 ? 'rgba(198,146,58,0.13)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${proof.strength >= 4 ? 'rgba(34,197,94,0.34)' : proof.strength >= 2 ? 'rgba(198,146,58,0.36)' : 'rgba(255,255,255,0.10)'}`,
                        color: proof.strength >= 4 ? '#86EFAC' : proof.strength >= 2 ? '#F8DFB0' : '#d8c6a3',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {proof.label}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: 18, fontWeight: 800, color: '#FFFFFF',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      margin: '0 0 4px',
                    }}>
                      {displayName}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin style={{ width: 14, height: 14, color: '#C6923A' }} />
                      <span style={{ fontSize: 13, color: '#d8c6a3', fontWeight: 500 }}>
                        {city ? `${city}${state ? ', ' : ''}` : ''}{state || p.country_code || targetCountry}
                      </span>
                      {p.last_seen_at && <FreshnessBadge lastSeenAt={p.last_seen_at} />}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#d8c6a3]">
                      {getClaimLine(p, proof.label, proof.strength)}
                    </p>
                  </div>

                  {/* Profile signal score */}
                  {profileSignal > 0 && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 8, flexShrink: 0,
                      background: hasHighSignal ? 'rgba(198,146,58,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${hasHighSignal ? 'rgba(198,146,58,0.34)' : 'rgba(255,255,255,0.10)'}`,
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: hasHighSignal ? '#F8DFB0' : '#fff7e8' }}>
                        {profileSignal}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#d8c6a3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Signal
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {attributes.map((attribute) => (
                    <span
                      key={attribute}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                        color: '#d8c6a3', textTransform: 'capitalize',
                      }}
                    >
                      {attribute}
                    </span>
                  ))}
                  {attributes.length === 0 && p.equipment_types && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(198,146,58,0.10)', border: '1px solid rgba(198,146,58,0.28)',
                      color: '#F8DFB0', textTransform: 'capitalize',
                    }}>
                      {typeof p.equipment_types === 'string' ? p.equipment_types.split(',')[0]?.trim() : 'Escort'}
                    </span>
                  )}
                  {p.verification_status === 'verified' && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.34)',
                      color: '#86EFAC', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Shield style={{ width: 12, height: 12 }} /> Verified
                    </span>
                  )}
                  {hasRealRating && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                      color: '#fff7e8', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <Star style={{ width: 12, height: 12, color: '#EAB308' }} /> {Number(p.rating_avg).toFixed(1)} public rating
                    </span>
                  )}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    background: contactSignal ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${contactSignal ? 'rgba(59,130,246,0.28)' : 'rgba(255,255,255,0.10)'}`,
                    color: contactSignal ? '#BFDBFE' : '#d8c6a3',
                  }}>
                    {contactSignal ? 'Contact path available' : 'Request or claim contact'}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
                    color: '#d8c6a3',
                  }}>
                    Source confidence: {cardCopy.sourceConfidenceLabel}
                    </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link
                  href={profileHref}
                  onClick={() => track.event('directory_profile_click', { entity_id: recordId, entity_family: p.entity_family, country_code: targetCountry })}
                  style={{
                    flex: '1 1 130px', padding: '10px 12px', borderRadius: 8, textAlign: 'center',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff7e8', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', transition: 'all 0.15s',
                    minWidth: 0,
                  }}
                  className="hover:bg-white/10"
                >
                  {cardCopy.profileCta}
                </Link>
                <Link
                  href={packetHref}
                  onClick={() => track.event('directory_support_packet_click', { entity_id: recordId, entity_family: p.entity_family, country_code: targetCountry })}
                  style={{
                    flex: '1.2 1 150px', padding: '10px 12px', borderRadius: 8, textAlign: 'center',
                    background: 'linear-gradient(135deg, #C6923A 0%, #8A6428 100%)',
                    color: '#0B0B0C', fontSize: 13, fontWeight: 800,
                    textDecoration: 'none', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    minWidth: 0,
                  }}
                  className="hover:shadow-[0_0_24px_rgba(198,146,58,0.28)]"
                >
                  <ClipboardList style={{ width: 14, height: 14 }} />
                  {cardCopy.packetCta}
                </Link>
                <Link
                  href={claimHref}
                  onClick={() => track.event('directory_claim_profile_click', { entity_id: recordId, entity_family: p.entity_family, country_code: targetCountry })}
                  style={{
                    flex: '1 1 100%', padding: '9px 12px', borderRadius: 8, textAlign: 'center',
                    background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.28)',
                    color: '#F8DFB0', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}
                  className="hover:bg-[#C6923A]/14"
                >
                  {cardCopy.claimCta}
                </Link>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full">
            <EmptyMarketState country={targetCountry} dataIssue={dataIssue} />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {filtered !== null && (
                <button
                  type="button"
                  onClick={() => setFiltered(null)}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
                >
                  Clear filters
                </button>
              )}
              <Link href={`/load-board/post?country=${encodeURIComponent(targetCountry)}`} className="rounded-lg bg-[#C6923A] px-4 py-2 text-sm font-black text-[#0B0B0C] hover:bg-[#E0B05C]">
                Build support packet
              </Link>
              <Link href="/claim" className="rounded-lg border border-[#C6923A]/35 bg-[#C6923A]/10 px-4 py-2 text-sm font-bold text-[#F8DFB0] hover:bg-[#C6923A]/16">
                Claim a profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
