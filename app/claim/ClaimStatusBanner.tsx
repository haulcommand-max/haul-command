/**
 * ClaimStatusBanner — Auth-aware claim progress banner.
 *
 * P0: Shows the authenticated user's real claim status with a progress bar
 * and contextual next-action CTA. Only renders for authenticated users.
 */
'use client';

import Link from 'next/link';

interface ClaimStatusBannerProps {
  claimState: string | null;
  profileCompletion: number;
  operatorName: string | null;
}

const STATE_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  nextHref: string;
  nextLabel: string;
  description: string;
}> = {
  unclaimed: {
    label: 'Not Claimed',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
    nextHref: '/auth/register?intent=claim',
    nextLabel: 'Start Claim',
    description: 'Claim your listing to appear in search and receive load offers.',
  },
  claim_started: {
    label: 'Claim In Progress',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.2)',
    nextHref: '/claim',
    nextLabel: 'Continue',
    description: 'Complete your identity verification to proceed.',
  },
  otp_verified: {
    label: 'Identity Verified',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    nextHref: '/settings/profile',
    nextLabel: 'Build Profile',
    description: 'Your identity is verified. Build your profile to go live.',
  },
  ownership_granted: {
    label: 'Ownership Confirmed',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    nextHref: '/settings/profile',
    nextLabel: 'Build Profile',
    description: 'You own this listing. Complete your profile to appear in search.',
  },
  profile_started: {
    label: 'Profile In Progress',
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.08)',
    borderColor: 'rgba(139,92,246,0.2)',
    nextHref: '/settings/profile',
    nextLabel: 'Continue Profile',
    description: 'Keep building — reach 50% for search visibility.',
  },
  profile_50: {
    label: 'Search Visible',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
    nextHref: '/settings/documents',
    nextLabel: 'Upload Documents',
    description: 'You\'re in search! Upload documents to reach dispatch eligibility.',
  },
  profile_70: {
    label: 'Nearly Dispatch-Ready',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
    nextHref: '/settings/documents',
    nextLabel: 'Finish Verification',
    description: 'Almost there. Complete verification to start receiving load offers.',
  },
  dispatch_eligible: {
    label: 'Dispatch Eligible',
    color: '#22C55E',
    bgColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
    nextHref: '/loads',
    nextLabel: 'Browse Loads',
    description: 'You\'re dispatch-eligible! Start accepting load offers.',
  },
  premium_trial: {
    label: 'Premium Trial',
    color: '#D4A844',
    bgColor: 'rgba(212,168,68,0.08)',
    borderColor: 'rgba(212,168,68,0.2)',
    nextHref: '/dashboard',
    nextLabel: 'Dashboard',
    description: 'You have full platform access. Make the most of your trial.',
  },
  premium_paid: {
    label: 'Premium',
    color: '#D4A844',
    bgColor: 'rgba(212,168,68,0.08)',
    borderColor: 'rgba(212,168,68,0.2)',
    nextHref: '/dashboard',
    nextLabel: 'Dashboard',
    description: 'Full premium access active.',
  },
};

export default function ClaimStatusBanner({ claimState, profileCompletion, operatorName }: ClaimStatusBannerProps) {
  const config = STATE_CONFIG[claimState ?? 'unclaimed'] ?? STATE_CONFIG.unclaimed;

  return (
    <div style={{
      padding: '16px 20px',
      background: config.bgColor,
      borderBottom: `1px solid ${config.borderColor}`,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 200 }}>
          {/* Status dot */}
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: config.color,
            boxShadow: `0 0 8px ${config.color}40`,
            flexShrink: 0,
          }} />

          <div>
            {/* Status label + operator name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: config.color,
              }}>
                {config.label}
              </span>
              {operatorName && (
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                }}>
                  — {operatorName}
                </span>
              )}
            </div>
            {/* Description */}
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.6)',
              margin: '2px 0 0', lineHeight: 1.4,
            }}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Progress bar + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* Progress bar */}
          {profileCompletion > 0 && profileCompletion < 100 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 80, height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${profileCompletion}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: config.color,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: config.color,
                whiteSpace: 'nowrap',
              }}>
                {profileCompletion}%
              </span>
            </div>
          )}

          {/* CTA button */}
          <Link
            href={config.nextHref}
            aria-label={config.nextLabel}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              background: `${config.color}20`,
              border: `1px solid ${config.color}40`,
              color: config.color,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {config.nextLabel} →
          </Link>
        </div>
      </div>
    </div>
  );
}
