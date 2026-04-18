import { supabaseServer } from "@/lib/supabase/server";

export type AvailableOperatorRow = {
  operator_id: string;
  availability_status: "available" | "busy" | "offline";
  last_known_lat: number | null;
  last_known_lon: number | null;
  updated_at: string;
  
  // Enriched
  company_name: string;
  slug: string;
  trust_score: number;
  certifications?: string[];
  equipment_flags?: string[];
  city?: string;
  state?: string;
};

export async function getLiveAvailableOperators(limit = 100): Promise<AvailableOperatorRow[]> {
  const sb = supabaseServer();
  
  // Query operator_availability where they are visibly online
  const { data, error } = await sb
    .from('operator_availability')
    .select(`
      operator_id,
      availability_status,
      last_known_lat,
      last_known_lon,
      updated_at
    `)
    .eq('availability_status', 'available')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    console.error("No active broadcasts found or error:", error);
    return [];
  }

  // To enrich with company/broker data we query hc_global_operators
  const operatorIds = data.map(d => d.operator_id);
  
  const { data: globalOps, error: gError } = await sb
    .from('hc_global_operators')
    .select('id, slug, company_name, trust_score, certifications_list, raw_equipment, city_county, state_code')
    .in('id', operatorIds);

  if (gError || !globalOps) {
    return data as any; // Fallback un-enriched
  }

  const opMap = new Map(globalOps.map(go => [go.id, go]));

  return data.map(d => {
    const op = opMap.get(d.operator_id);
    return {
      ...d,
      company_name: op?.company_name || 'Verified Operator',
      slug: op?.slug || d.operator_id,
      trust_score: op?.trust_score || 85,
      certifications: op?.certifications_list || [],
      equipment_flags: op?.raw_equipment || [],
      city: op?.city_county || 'Local',
      state: op?.state_code || 'US'
    };
  }) as AvailableOperatorRow[];
}
