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
  const hasToken = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!hasToken) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#f9fafb',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>🗺️</div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: 0 }}>
          Command Map Initializing
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, lineHeight: 1.6 }}>
          The live dispatch map requires a Mapbox access token to render. 
          Set <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment to activate the map.
        </p>
        <a href="/directory" style={{
          padding: '12px 24px', borderRadius: 10,
          background: '#C6923A', color: '#fff', fontWeight: 700,
          fontSize: 13, textDecoration: 'none', marginTop: 8,
        }}>
          Browse Operator Directory Instead →
        </a>
      </div>
    );
  }

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
