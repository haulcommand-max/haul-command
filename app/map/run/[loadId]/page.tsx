import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ConvoyMapClient from './ConvoyMapClient';

export async function generateMetadata(
  { params }: { params: Promise<{ loadId: string }> }
): Promise<Metadata> {
  const { loadId } = await params;
  return {
    title: `Live Convoy Tracking — Run ${loadId.slice(0, 8)} | Haul Command`,
    description: 'Real-time convoy view with permit route enforcement, clearance warnings, and multi-escort coordination.',
  };
}

export default async function ConvoyRunPage(
  { params }: { params: Promise<{ loadId: string }> }
) {
  const { loadId } = await params;
  const supabase = createClient();

  const { data: load } = await supabase
    .from('hc_loads')
    .select('id, title, origin_city, origin_state, destination_city, destination_state, width_ft, height_ft, length_ft, weight_lbs')
    .eq('id', loadId)
    .single();

  const { data: permit } = await supabase
    .from('permit_routes')
    .select('load_dimensions, permit_number, total_distance_km')
    .eq('load_id', loadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const dims = permit?.load_dimensions as { width_m?: number; height_m?: number; length_m?: number; weight_kg?: number } | null;
  const loadDimensions = {
    width_m: dims?.width_m ?? (load?.width_ft ? Number(load.width_ft) * 0.3048 : 4.5),
    height_m: dims?.height_m ?? (load?.height_ft ? Number(load.height_ft) * 0.3048 : 4.5),
    length_m: dims?.length_m ?? (load?.length_ft ? Number(load.length_ft) * 0.3048 : 30),
    weight_kg: dims?.weight_kg ?? (load?.weight_lbs ? Number(load.weight_lbs) * 0.453592 : 40000),
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f19', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(10,15,25,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(241,169,27,0.2)',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/map/live" style={{ color: '#F1A91B', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>← All Loads</Link>
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f5f5f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {load?.title ?? `Load ${loadId.slice(0, 8)}`}
          </div>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            {load?.origin_city}, {load?.origin_state} → {load?.destination_city}, {load?.destination_state}
            {permit?.permit_number && ` · Permit #${permit.permit_number}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8' }}>
          <span>H: {(loadDimensions.height_m * 3.281).toFixed(0)}ft</span>
          <span>W: {(loadDimensions.width_m * 3.281).toFixed(0)}ft</span>
          <span>{Math.round(loadDimensions.weight_kg * 2.20462).toLocaleString()} lbs</span>
        </div>
      </div>
      <div style={{ width: '100%', height: '100%', paddingTop: 48 }}>
        <ConvoyMapClient loadId={loadId} loadDimensions={loadDimensions} />
      </div>
    </div>
  );
}
