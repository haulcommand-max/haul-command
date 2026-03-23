'use client';
import dynamic from 'next/dynamic';
const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

interface ConvoyMapClientProps {
  loadId: string;
  loadDimensions: { width_m: number; height_m: number; length_m: number; weight_kg: number };
}

export default function ConvoyMapClient({ loadId, loadDimensions }: ConvoyMapClientProps) {
  return (
    <HeavyHaulMap
      loadId={loadId}
      mode="broker"
      showPermitRoute={true}
      loadDimensions={loadDimensions}
      showHud={true}
    />
  );
}
