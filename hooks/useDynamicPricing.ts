'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * HAUL COMMAND - DYNAMIC PRICING SENSOR
 * Subscribes to the corridor_monopoly_state to fluidly adjust margins internally
 * without warning competitors on the frontend.
 */
export function useDynamicPricing(corridorName: string, baseInternalCost: number) {
  const [monopolyMargin, setMonopolyMargin] = useState(1.0);
  const [isDominating, setIsDominating] = useState(false);

  useEffect(() => {
    // Check initial corridor monopoly state
    const fetchCurrentState = async () => {
      const { data } = await supabase
        .from('corridor_monopoly_state')
        .select('margin_multiplier, dominance_score')
        .eq('corridor_name', corridorName)
        .single();

      if (data) {
        setMonopolyMargin(data.margin_multiplier);
        setIsDominating(data.dominance_score > 0.7);
      }
    };

    fetchCurrentState();

    // Listen for AI Pricing Engine altering the multiplier Mid-Session
    const pricingChannel = supabase.channel(`pricing_${corridorName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'corridor_monopoly_state',
          filter: `corridor_name=eq.${corridorName}`
        },
        (payload) => {
          const newState = payload.new;
          // Fluid transition if multiplier increases
          setMonopolyMargin(newState.margin_multiplier);
          setIsDominating(newState.dominance_score > 0.7);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pricingChannel);
    };
  }, [corridorName]);

  // Derived output values instantly update logic if multiplier shifts 
  // (e.g. from 1.05 to 1.35 when /lock corridor is fired)
  const brokerFacingPrice = Math.floor(baseInternalCost * monopolyMargin);

  return {
    baseInternalCost,
    brokerFacingPrice,
    monopolyMargin,
    isDominating, // UI can use this to show "Route Dominated" trust badges
  };
}
