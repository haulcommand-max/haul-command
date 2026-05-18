'use client';

import { HouseAdSlot } from '@/components/ads/HouseAdSlot';

interface DirectorySponsorCardProps {
  position: 'upper' | 'lower';
  stateCode?: string;
  countryCode?: string;
}

export default function DirectorySponsorCard({ position, stateCode, countryCode = 'US' }: DirectorySponsorCardProps) {
  return (
    <HouseAdSlot
      surface="directory.search.sponsor"
      placementId={`directory-${position}-sponsor-${countryCode.toLowerCase()}-${stateCode?.toLowerCase() ?? 'all'}`}
      intent="directory"
      country={countryCode}
      region={stateCode}
      pageType="directory"
      slotType={position === 'upper' ? 'inline_band' : 'inline_card'}
      userIntent={position === 'upper' ? 'territory_sponsorship' : 'directory_campaign'}
      funnelStage={position === 'upper' ? 'consideration' : 'activation'}
      variant={position === 'upper' ? 'banner' : 'compact'}
      className="w-full"
    />
  );
}
