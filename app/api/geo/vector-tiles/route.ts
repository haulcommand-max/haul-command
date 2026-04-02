import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const minLat = parseFloat(searchParams.get('ymin') || '-90');
  const minLng = parseFloat(searchParams.get('xmin') || '-180');
  const maxLat = parseFloat(searchParams.get('ymax') || '90');
  const maxLng = parseFloat(searchParams.get('xmax') || '180');
  const zoom = parseInt(searchParams.get('z') || '5');

  const supabase = createClient();

  // Call the PostGIS clustering function we created in DB migration
  // "get_operator_clusters" utilizes earthdistance scaling to protect browser heaps
  const { data: clusters, error } = await supabase.rpc('get_operator_clusters', {
      min_lat: minLat,
      min_lng: minLng,
      max_lat: maxLat,
      max_lng: maxLng,
      zoom_level: zoom
  });

  if (error) {
      return NextResponse.json({ error: 'Geospatial error' }, { status: 500 });
  }

  // Package to pure Vector Tile / GeoJSON structure
  const featureCollection = {
    type: 'FeatureCollection',
    features: clusters.map((c: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [c.center_lng, c.center_lat] // GeoJSON expects [lng, lat]
      },
      properties: {
        cluster_id: c.cluster_id,
        point_count: Number(c.operator_count)
      }
    }))
  };

  return NextResponse.json(featureCollection, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  });
}
