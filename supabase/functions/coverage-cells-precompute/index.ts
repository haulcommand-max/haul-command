import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

// Simple grid sizing: e.g. 0.5 degrees for clustering cells
const GRID_SIZE = 0.5;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const supabase = getServiceClient();

  // Precompute MapLibre coverage cells by querying providers
  const { data: providers, error } = await supabase
    .from("providers")
    .select("provider_key, lat, lng, trust_score, status")
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Aggregate providers into geographic cells
  // cell_key = "latGroup_lngGroup"
  const cells = new Map<string, any>();

  for (const p of providers || []) {
    if (!p.lat || !p.lng) continue;
    
    // Nearest interval
    const centerLat = Math.round(p.lat / GRID_SIZE) * GRID_SIZE;
    const centerLng = Math.round(p.lng / GRID_SIZE) * GRID_SIZE;
    const cellKey = `z1_${centerLat}_${centerLng}`;
    
    if (!cells.has(cellKey)) {
        cells.set(cellKey, {
            grid_id: "z1",
            cell_key: cellKey,
            cell_center_lat: centerLat,
            cell_center_lon: centerLng,
            count: 0,
            active_count: 0,
            total_trust: 0
        });
    }

    const cell = cells.get(cellKey)!;
    cell.count += 1;
    if (p.status === 'active' || p.status === 'live') {
        cell.active_count += 1;
    }
    cell.total_trust += (p.trust_score || 0);
  }

  const upsertPayload = [];
  for (const cell of cells.values()) {
      upsertPayload.push({
          grid_id: cell.grid_id,
          cell_key: cell.cell_key,
          cell_center_lat: cell.cell_center_lat,
          cell_center_lon: cell.cell_center_lon,
          measures_json: {
              supply_count: cell.count,
              active_supply_count: cell.active_count,
              avg_trust: cell.count > 0 ? (cell.total_trust / cell.count) : 0
          },
          updated_at: new Date().toISOString()
      });
  }

  // Batch Upsert
  if (upsertPayload.length > 0) {
      const { error: upsertErr } = await supabase
        .from('coverage_cells')
        .upsert(upsertPayload, { onConflict: "cell_key" });
        
      if (upsertErr) {
          return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500, headers: corsHeaders });
      }
  }

  return new Response(JSON.stringify({ ok: true, cellsProcessed: upsertPayload.length }), {
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
});
