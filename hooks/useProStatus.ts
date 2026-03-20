'use client';

/**
 * useProStatus — Client-side hook to check if user has Pro subscription
 * 
 * Checks profiles.subscription_tier from Supabase.
 * Returns: { isPro, isEnterprise, tier, loading, user }
 * 
 * Tiers: free | pro | elite | enterprise
 * isPro = true for pro, elite, enterprise
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Tier = 'free' | 'pro' | 'elite' | 'enterprise';

interface ProStatus {
  isPro: boolean;
  isEnterprise: boolean;
  tier: Tier;
  loading: boolean;
  userId: string | null;
}

export function useProStatus(): ProStatus {
  const [status, setStatus] = useState<ProStatus>({
    isPro: false,
    isEnterprise: false,
    tier: 'free',
    loading: true,
    userId: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) setStatus({ isPro: false, isEnterprise: false, tier: 'free', loading: false, userId: null });
          return;
        }

        // Check subscription_tier from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        const tier = ((profile as any)?.subscription_tier || 'free') as Tier;
        const isPro = tier === 'pro' || tier === 'elite' || tier === 'enterprise';
        const isEnterprise = tier === 'enterprise';

        if (!cancelled) {
          setStatus({ isPro, isEnterprise, tier, loading: false, userId: user.id });
        }
      } catch {
        if (!cancelled) {
          setStatus({ isPro: false, isEnterprise: false, tier: 'free', loading: false, userId: null });
        }
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return status;
}
