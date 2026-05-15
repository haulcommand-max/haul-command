'use client';

import { HouseAdSlot } from '@/components/ads/HouseAdSlot';

type AdGridSponsorSlotProps = {
  regionName: string;
  type: string;
  countryCode: string;
};

export function AdGridSponsorSlot({ regionName, type, countryCode }: AdGridSponsorSlotProps) {
  const normalizedType = type.replace(/_/g, '-');

  return (
    <HouseAdSlot
      surface="tools.sponsor"
      placementId={`tool-sponsor-${countryCode.toLowerCase()}-${normalizedType}`}
      intent="tools"
      country={countryCode}
      region={regionName}
      role={type}
      topic={normalizedType}
      pageType="tools"
      slotType="inline_card"
      userIntent="tool_result_to_sponsor_or_route_packet"
      funnelStage="activation"
      variant="card"
      className="min-h-[220px]"
    />
  );
}
