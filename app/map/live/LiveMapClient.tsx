'use client';
import dynamic from 'next/dynamic';

// ── Swap to CommandMapV2 ─────────────────────────────────────────
// CommandMapV2 = "Bloomberg Terminal for Heavy Haul"
// 7 layers: corridor glow, load heatmap, load clusters, escort dots,
//           hard-fill alert zones, police/pole zones, escort density heatmap
// HUD: layer toggles, live presence counter, alert feed, fill rate stats
// Supabase realtime + 30s poll fallback
// ─────────────────────────────────────────────────────────────────
const CommandMapV2 = dynamic(
  () => import('@/components/map/CommandMapV2').then(m => m.CommandMapV2 ?? m.default),
  { ssr: false, loading: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f19',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#C6923A', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>
      LOADING COMMAND MAP…
    </div>
  )}
);

export default function LiveMapClient() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f19', overflow: 'hidden' }}>
      <CommandMapV2
        showHud={true}
        initialCenter={[-95.7, 37.0]}
        initialZoom={4.5}
      />
    </div>
  );
}
