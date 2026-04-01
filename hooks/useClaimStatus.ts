/**
 * useClaimStatus — Real claim status from Supabase auth session.
 *
 * Reads the current user's claim state from their profile + claims table.
 * Returns null for unauthenticated users, enabling conditional UI.
 *
 * P0: Replaces hardcoded/static claim CTAs with session-aware truth.
 */
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type ClaimState } from '@/lib/claim-engine';

export interface ClaimStatus {
  /** Whether user is authenticated */
  authenticated: boolean;
  /** User ID from auth session */
  userId: string | null;
  /** Current claim state from claim engine */
  claimState: ClaimState | null;
  /** Operator listing ID if claimed */
  operatorId: string | null;
  /** Listing name */
  operatorName: string | null;
  /** Profile completion percentage */
  profileCompletion: number;
  /** Whether the user has a verified listing */
  isVerified: boolean;
  /** Whether user is dispatch-eligible */
  isDispatchEligible: boolean;
  /** Whether the profile is premium */
  isPremium: boolean;
  /** Trust tier */
  trustTier: 'elite' | 'strong' | 'verified' | 'basic' | 'unverified' | null;
  /** Next action the user should take */
  nextAction: ClaimNextAction | null;
  /** Loading state */
  loading: boolean;
}

export interface ClaimNextAction {
  label: string;
  href: string;
  urgency: 'high' | 'medium' | 'low';
  description: string;
}

function getNextAction(
  claimState: ClaimState | null,
  profileCompletion: number,
  authenticated: boolean,
): ClaimNextAction | null {
  if (!authenticated) {
    return {
      label: 'Find My Listing',
      href: '/auth/register?intent=claim',
      urgency: 'high',
      description: 'Claim your free listing to start receiving load offers.',
    };
  }

  switch (claimState) {
    case null:
    case 'unclaimed':
      return {
        label: 'Claim Your Listing',
        href: '/claim',
        urgency: 'high',
        description: 'Your listing is unclaimed. Claim it to unlock visibility and earnings.',
      };
    case 'claim_started':
      return {
        label: 'Complete Verification',
        href: '/claim',
        urgency: 'high',
        description: 'Your claim is in progress. Verify your identity to continue.',
      };
    case 'otp_verified':
    case 'ownership_granted':
      return {
        label: 'Build Your Profile',
        href: '/settings/profile',
        urgency: 'high',
        description: 'Your listing is verified! Complete your profile to appear in search.',
      };
    case 'profile_started':
      return {
        label: 'Finish Profile',
        href: '/settings/profile',
        urgency: 'medium',
        description: `Profile is ${profileCompletion}% complete. Reach 50% for search visibility.`,
      };
    case 'profile_50':
      return {
        label: 'Upload Documents',
        href: '/settings/documents',
        urgency: 'medium',
        description: `Profile is ${profileCompletion}% complete. Reach 70% for dispatch eligibility.`,
      };
    case 'profile_70':
    case 'verification_pending':
      return {
        label: 'Verification Pending',
        href: '/settings/profile',
        urgency: 'low',
        description: 'Your documents are being reviewed. You\'ll be dispatch-eligible soon.',
      };
    case 'dispatch_eligible':
      return {
        label: 'Explore Premium',
        href: '/pricing',
        urgency: 'low',
        description: 'You\'re dispatch-eligible! Upgrade to Premium for priority matching.',
      };
    case 'premium_trial':
    case 'premium_paid':
      return null; // No action needed
    default:
      return null;
  }
}

export function useClaimStatus(): ClaimStatus {
  const [status, setStatus] = useState<ClaimStatus>({
    authenticated: false,
    userId: null,
    claimState: null,
    operatorId: null,
    operatorName: null,
    profileCompletion: 0,
    isVerified: false,
    isDispatchEligible: false,
    isPremium: false,
    trustTier: null,
    nextAction: getNextAction(null, 0, false),
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchClaimStatus() {
      try {
        // 1. Get auth session
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setStatus(prev => ({
            ...prev,
            authenticated: false,
            loading: false,
            nextAction: getNextAction(null, 0, false),
          }));
          return;
        }

        // 2. Get user's claim/profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('claim_state, operator_id, profile_completion_pct, trust_tier, is_verified, subscription_tier')
          .eq('id', user.id)
          .single();

        // 3. Get operator name if claimed
        let operatorName: string | null = null;
        if (profile?.operator_id) {
          const { data: operator } = await supabase
            .from('hc_global_operators')
            .select('company_name')
            .eq('id', profile.operator_id)
            .single();
          operatorName = operator?.company_name ?? null;
        }

        const claimState = (profile?.claim_state as ClaimState) ?? null;
        const profileCompletion = profile?.profile_completion_pct ?? 0;
        const isVerified = profile?.is_verified ?? false;
        const isPremium = ['premium_trial', 'premium_paid'].includes(claimState ?? '');
        const isDispatchEligible = ['dispatch_eligible', 'premium_trial', 'premium_paid'].includes(claimState ?? '');

        setStatus({
          authenticated: true,
          userId: user.id,
          claimState,
          operatorId: profile?.operator_id ?? null,
          operatorName,
          profileCompletion,
          isVerified,
          isDispatchEligible,
          isPremium,
          trustTier: profile?.trust_tier ?? null,
          nextAction: getNextAction(claimState, profileCompletion, true),
          loading: false,
        });
      } catch (err) {
        console.error('[useClaimStatus] Error:', err);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    }

    fetchClaimStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchClaimStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  return status;
}
