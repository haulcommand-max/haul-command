'use client';

import React from 'react';
import Link from 'next/link';
import type { NormalizedProfile } from '@/lib/resolvers/resolveProfile';
import MobileMarketHeartbeat from '@/components/market/MobileMarketHeartbeat';
import { CapabilityMatrix, ServiceAreaModule, ContactPreferenceModule, ActivitySignal, TrustStrengthSummary } from '@/components/profile/DeepProfileModules';
import { ClaimPressureEngine } from '@/components/market/ClaimPressureEngine';

/* ══════════════════════════════════════════════════════════════
   MobileProviderProfile — Real-data mobile profile view.
   Consumes NormalizedProfile from the parent resolver.
   No mock data. No DEFAULT_PROVIDER.
   Shows: identity, trust score, certs, location, action bar,
   claim banner (if unclaimed), and escape nav.
   ══════════════════════════════════════════════════════════════ */

interface MobileProviderProfileProps {
  profile: NormalizedProfile;
  entityId: string;
  isClaimed: boolean;
  isSeeded: boolean;
}

/* ── Icons ── */
function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ShieldIcon({ verified }: { verified: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill={verified ? 'var(--m-gold, #D4A844)' : 'var(--m-text-muted, #6a7181)'}
      stroke="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      {verified && (
        <polyline points="9 12 11 14 15 10" stroke="#000" strokeWidth={2}
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

/* ── Trust Score Ring ── */
function TrustScoreRing({ score }: { score: number }) {
  if (score <= 0) return null;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#22C55E' : score >= 50 ? 'var(--m-gold, #D4A844)' : '#F59E0B';

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none"
          stroke="var(--m-border-subtle, rgba(255,255,255,0.06))" strokeWidth="3"/>
        <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 900, color,
      }}>
        {score}
      </div>
    </div>
  );
}

/* ── Stat Cell ── */
function StatCell({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div style={{
      padding: '12px 8px', borderRadius: 14, textAlign: 'center',
      background: 'var(--m-surface, rgba(255,255,255,0.04))',
      border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
    }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: color || 'var(--m-text-primary, #f5f7fb)' }}>
        {value}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, color: 'var(--m-text-muted, #6a7181)',
        marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── Cert Badge ── */
function CertBadge({ label, active }: { label: string; active: boolean }) {
  if (!active) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 8,
      background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
      color: '#22C55E', fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      ✓ {label}
    </span>
  );
}

/* ── Main Component ── */
export default function MobileProviderProfile({
  profile,
  entityId,
  isClaimed,
  isSeeded,
}: MobileProviderProfileProps) {
  const displayName = profile.company_name || profile.display_name || 'Unknown Operator';
  const location = [profile.home_base_city, profile.home_base_state].filter(Boolean).join(', ');
  const isVerified = profile.verification_status === 'verified';
  const certs = profile.certifications_json || {};
  const hasTWIC = certs.twic ?? false;
  const hasAmber = certs.amber_light ?? false;
  const hasHighPole = certs.high_pole ?? false;
  const isInsured = profile.insurance_status === 'verified';
  const initials = displayName.split(' ').map(w => w.charAt(0)).join('').slice(0, 2);

  // Trust status
  const isColdStart = profile.completed_escorts < 10;
  let trustLabel = '';
  let trustColor = '';
  if (isColdStart && isVerified) {
    trustLabel = 'Building History';
    trustColor = '#F59E0B';
  } else if (!isColdStart && profile.trust_score >= 85) {
    trustLabel = 'Top Performer';
    trustColor = '#22C55E';
  } else if (!isColdStart && profile.trust_score >= 50) {
    trustLabel = 'Established';
    trustColor = '#3B82F6';
  } else if (!isVerified) {
    trustLabel = 'Unverified';
    trustColor = 'var(--m-text-muted, #6a7181)';
  }

  // Completeness
  let completeness = 20;
  if (isVerified) completeness = 45;
  if (hasTWIC) completeness += 10;
  if (isInsured) completeness += 10;
  if (hasAmber || hasHighPole) completeness += 10;
  if (profile.vehicle_type) completeness += 5;
  if (profile.us_dot_number) completeness += 15;
  completeness = Math.min(100, completeness);
  const complColor = completeness >= 80 ? '#22C55E' : completeness >= 50 ? 'var(--m-gold, #D4A844)' : '#EF4444';

  return (
    <div style={{ background: 'var(--m-bg, #060b12)', minHeight: '100dvh' }}>

      {/* ── Top nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px var(--m-screen-pad, 16px) 0',
      }}>
        <Link href="/directory" style={{
          display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
          color: 'var(--m-text-secondary, #c7ccd7)',
        }}>
          <BackIcon />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Directory</span>
        </Link>
      </div>

      {/* ── Hero ── */}
      <div style={{ padding: 'var(--m-md, 16px) var(--m-screen-pad, 16px)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(212,168,68,0.08)',
            border: `2px solid ${isVerified ? 'var(--m-gold, #D4A844)' : 'var(--m-border-subtle, rgba(255,255,255,0.06))'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: 20, fontWeight: 900,
            color: 'var(--m-gold, #D4A844)',
          }}>
            {initials}
          </div>

          {/* Name + location */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 18, fontWeight: 800,
                color: 'var(--m-text-primary, #f5f7fb)',
                lineHeight: 1.2,
              }}>
                {displayName}
              </span>
              <ShieldIcon verified={isVerified} />
            </div>
            {location && (
              <div style={{
                fontSize: 13, color: 'var(--m-text-secondary, #c7ccd7)',
                marginTop: 2, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                📍 {location}
              </div>
            )}
            {trustLabel && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 6, padding: '2px 8px', borderRadius: 6,
                background: `${trustColor}15`, fontSize: 10, fontWeight: 800,
                color: trustColor, textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {trustLabel}
              </div>
            )}
          </div>

          {/* Trust ring */}
          <TrustScoreRing score={profile.trust_score} />
        </div>
      </div>

      {/* ── Action Row ── */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '0 var(--m-screen-pad, 16px)',
        marginBottom: 16,
      }}>
        <button style={{
          flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderRadius: 12, border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
          background: 'var(--m-surface, rgba(255,255,255,0.04))',
          color: 'var(--m-text-primary, #f5f7fb)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <PhoneIcon /> Call
        </button>
        <button style={{
          flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderRadius: 12, border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
          background: 'var(--m-surface, rgba(255,255,255,0.04))',
          color: 'var(--m-text-primary, #f5f7fb)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          <MessageIcon /> Message
        </button>
        <button style={{
          flex: 1.2, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, var(--m-gold, #D4A844), #f1c27b)',
          color: '#060b12', fontSize: 13, fontWeight: 800, cursor: 'pointer',
          boxShadow: '0 2px 12px rgba(212,168,68,0.2)',
        }}>
          Request
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
        padding: '0 var(--m-screen-pad, 16px)',
      }}>
        <StatCell
          value={String(profile.completed_escorts)}
          label="Escorts"
          color={profile.completed_escorts > 0 ? 'var(--m-gold, #D4A844)' : undefined}
        />
        <StatCell
          value={profile.reliability_score > 0 ? `${profile.reliability_score}%` : '—'}
          label="Reliability"
          color={profile.reliability_score >= 80 ? '#22C55E' : undefined}
        />
        <StatCell
          value={profile.rating_score > 0 ? profile.rating_score.toFixed(1) : '—'}
          label={`Rating${profile.review_count > 0 ? ` (${profile.review_count})` : ''}`}
          color={profile.rating_score >= 4 ? '#22C55E' : undefined}
        />
      </div>

      {/* ── Live Market Heartbeat ── */}
      {profile.home_base_state && (
        <MobileMarketHeartbeat
          state={profile.home_base_state}
          city={profile.home_base_city || undefined}
          showRecentLoads={true}
          showCta={true}
        />
      )}

      {/* ── Verification Strength ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'var(--m-surface, rgba(255,255,255,0.04))',
          border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Verification Strength
            </span>
            <span style={{ fontSize: 13, fontWeight: 900, color: complColor }}>
              {completeness}%
            </span>
          </div>
          <div style={{
            height: 4, borderRadius: 999, overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
          }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: complColor,
              width: `${completeness}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      </div>

      {/* ── Certifications ── */}
      {(isVerified || hasTWIC || hasAmber || hasHighPole || isInsured) && (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            Credentials
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {isVerified && <CertBadge label="Verified" active />}
            {isInsured && <CertBadge label="Insured 1M+" active />}
            {hasTWIC && <CertBadge label="TWIC" active />}
            {hasHighPole && <CertBadge label="High Pole" active />}
            {hasAmber && <CertBadge label="Amber Lights" active />}
          </div>
        </div>
      )}

      {/* ── Details ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'var(--m-surface, rgba(255,255,255,0.04))',
          border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
        }}>
          {profile.vehicle_type && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Vehicle
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
                {profile.vehicle_type}
              </div>
            </div>
          )}
          {profile.us_dot_number && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                US DOT
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
                {profile.us_dot_number}
              </div>
            </div>
          )}
          {profile.coverage_radius_miles && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Coverage
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
                {profile.coverage_radius_miles} mile radius
              </div>
            </div>
          )}
          {location && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Home Base
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--m-text-primary, #f5f7fb)' }}>
                📍 {location}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Performance Radar (if real data exists) ── */}
      {(profile.reliability_score > 0 || profile.responsiveness_score > 0) && (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 16 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: 'var(--m-text-muted, #6a7181)',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
          }}>
            Performance
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { label: 'Reliability', value: profile.reliability_score },
              { label: 'Responsiveness', value: profile.responsiveness_score },
              { label: 'Integrity', value: profile.integrity_score },
              { label: 'Compliance', value: profile.compliance_score },
            ].filter(s => s.value > 0).map(s => (
              <div key={s.label} style={{
                padding: 12, borderRadius: 12, textAlign: 'center',
                background: 'var(--m-surface, rgba(255,255,255,0.04))',
                border: '1px solid var(--m-border-subtle, rgba(255,255,255,0.06))',
              }}>
                <div style={{
                  fontSize: 20, fontWeight: 900,
                  color: s.value >= 80 ? '#22C55E' : s.value >= 50 ? 'var(--m-gold, #D4A844)' : '#F59E0B',
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: 'var(--m-text-muted, #6a7181)',
                  marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deep Profile Modules ── */}
      <div style={{ padding: '0 var(--m-screen-pad, 16px)', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {/* Activity signal */}
        <ActivitySignal
          status={profile.completed_escorts > 0 ? 'active_recently' : isVerified ? 'active_recently' : 'unknown'}
          lastActiveAt={profile.updated_at || undefined}
        />

        {/* Capability matrix */}
        <CapabilityMatrix
          serviceTypes={[]}
          equipment={profile.vehicle_type ? [profile.vehicle_type] : []}
          specializations={[
            ...(hasTWIC ? ['TWIC Certified'] : []),
            ...(hasAmber ? ['Amber Warning'] : []),
            ...(hasHighPole ? ['High Pole'] : []),
          ]}
        />

        {/* Service area */}
        <ServiceAreaModule
          homeMarket={location || undefined}
          nearbyStates={profile.home_base_state ? [profile.home_base_state] : []}
        />

        {/* Contact preferences */}
        <ContactPreferenceModule
          isVerified={isVerified}
        />

        {/* Trust strength */}
        <TrustStrengthSummary
          completionPercent={completeness}
          isClaimed={isClaimed}
          isShell={isSeeded && !isClaimed}
          verificationTier={isVerified ? 'verified' : isClaimed ? 'claimed' : isSeeded ? 'seeded' : 'unknown'}
        />
      </div>

      {/* ── Claim Pressure Engine (replaces basic banner) ── */}
      {isSeeded && !isClaimed && (
        <div style={{ padding: '0 var(--m-screen-pad, 16px)', marginTop: 20 }}>
          <ClaimPressureEngine
            listingId={entityId}
            listingName={displayName}
            variant="card"
            state={profile.home_base_state || undefined}
            showValueContrast={true}
          />
        </div>
      )}

      {/* Bottom spacer for nav */}
      <div style={{ height: 80 }} />
    </div>
  );
}
