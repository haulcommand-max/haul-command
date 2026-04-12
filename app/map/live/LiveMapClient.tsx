'use client';
import dynamic from 'next/dynamic';
const HeavyHaulMap = dynamic(() => import('@/components/map/HeavyHaulMap'), { ssr: false });

export default function LiveMapClient() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f19', overflow: 'hidden' }}>
      <HeavyHaulMap
        mode="dispatch"
        showPermitRoute={false}
        showHud={true}
        initialCenter={[-95.7, 37.0]}
        initialZoom={4.5}
      />
    </div>
  );
}