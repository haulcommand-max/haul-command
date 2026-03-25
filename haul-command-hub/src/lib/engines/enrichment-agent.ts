/**
 * lib/engines/enrichment-agent.ts
 * 
 * HAUL COMMAND — ENRICHMENT AGENT
 * Autonomously enriches operator profiles after ingestion.
 * Infers capabilities, generates SEO descriptions, assigns HC Trust,
 * and runs risk scoring.
 */

import { supabaseServer } from '@/lib/supabase-server';

const CATEGORY_CAPABILITIES: Record<string, string[]> = {
  pilot_car:       ['Pilot Car / Escort Vehicle', 'Wide Load Escort', 'Oversize Load Escort', 'Route Survey', 'Height Pole'],
  escort_vehicle:  ['Escort Vehicle', 'Pilot Car', 'Oversize Load Support'],
  towing:          ['Heavy Towing', 'Medium Duty Towing', 'Roadside Assistance', 'Recovery'],
  staging_yard:    ['Load Staging', 'Secure Parking', 'Equipment Storage', 'Transload'],
  broker:          ['Load Brokerage', 'Permit Coordination', 'Carrier Sourcing', 'Rate Negotiation'],
};

function inferCapabilities(categoryKey: string): string[] {
  return CATEGORY_CAPABILITIES[categoryKey] ?? ['General Logistics Support'];
}

function generateDescription(name: string, category: string, locality: string, state: string, country: string): string {
  const caps = inferCapabilities(category).join(', ');
  return `${name} is a professional ${category.replace('_', ' ')} operator based in ${locality}, ${state}. Services include ${caps}. Serving the oversize and overweight transport sector across ${country} with verified credentials and operational experience.`;
}

function riskScore(operator: { claim_status: string | null; phone: string | null; website: string | null; lat: number | null }): number {
  let risk = 0.5; // neutral base

  if (operator.claim_status === 'claimed') risk -= 0.2;
  if (!operator.phone) risk += 0.2;
  if (!operator.website) risk += 0.1;
  if (!operator.lat) risk += 0.1;

  return Math.max(0, Math.min(1, risk));
}

function generateHCNumber(country: string, state: string): string {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `HC-${country.toUpperCase()}-${state.toUpperCase()}-${rand}`;
}

interface EnrichmentResult {
  id: string;
  hc_trust_number: string;
  description: string;
  capabilities: string[];
  risk_score: number;
  enrichment_version: string;
}

export async function runEnrichmentAgent(limit = 50): Promise<{ enriched: number; skipped: number }> {
  const sb = supabaseServer();
  let enriched = 0;
  let skipped = 0;

  // Find unenriched operators (no description or no hc_trust_number)
  const { data: operators } = await sb
    .from('hc_places')
    .select('id, name, surface_category_key, locality, admin1_code, country_code, phone, website, lat, claim_status, hc_trust_number, description')
    .eq('status', 'published')
    .is('hc_trust_number', null)
    .limit(limit);

  for (const op of (operators ?? [])) {
    try {
      const capabilities = inferCapabilities(op.surface_category_key ?? 'pilot_car');
      const description = op.description 
        ? op.description 
        : generateDescription(
            op.name,
            op.surface_category_key ?? 'pilot_car',
            op.locality ?? '',
            op.admin1_code ?? '',
            op.country_code ?? 'US'
          );
      const hcNumber = generateHCNumber(op.country_code ?? 'US', op.admin1_code ?? 'XX');
      const risk = riskScore({
        claim_status: op.claim_status,
        phone: op.phone,
        website: op.website,
        lat: op.lat,
      });

      await sb.from('hc_places').update({
        hc_trust_number: hcNumber,
        description: description.slice(0, 800),
        enrichment_version: '1.0',
        updated_at: new Date().toISOString(),
      }).eq('id', op.id);

      // Store enrichment data separately if table exists
      try {
        await sb.from('hc_operator_intelligence').upsert({
          operator_id: op.id,
          capabilities: capabilities,
          risk_score: risk,
          hc_trust_number: hcNumber,
          enriched_at: new Date().toISOString(),
        }, { onConflict: 'operator_id' });
      } catch { /* table may not exist yet */ }

      enriched++;
    } catch {
      skipped++;
    }
  }

  return { enriched, skipped };
}

export async function enrichSingleOperator(operatorId: string): Promise<EnrichmentResult | null> {
  const sb = supabaseServer();

  const { data: op } = await sb
    .from('hc_places')
    .select('id, name, surface_category_key, locality, admin1_code, country_code, phone, website, lat, claim_status, description')
    .eq('id', operatorId)
    .maybeSingle();

  if (!op) return null;

  const capabilities = inferCapabilities(op.surface_category_key ?? 'pilot_car');
  const description = op.description 
    ? op.description 
    : generateDescription(op.name, op.surface_category_key ?? 'pilot_car', op.locality ?? '', op.admin1_code ?? '', op.country_code ?? 'US');
  const hcNumber = generateHCNumber(op.country_code ?? 'US', op.admin1_code ?? 'XX');
  const risk = riskScore({ claim_status: op.claim_status, phone: op.phone, website: op.website, lat: op.lat });

  await sb.from('hc_places').update({
    hc_trust_number: hcNumber,
    description: description.slice(0, 800),
    enrichment_version: '1.0',
    updated_at: new Date().toISOString(),
  }).eq('id', op.id);

  return {
    id: op.id,
    hc_trust_number: hcNumber,
    description,
    capabilities,
    risk_score: risk,
    enrichment_version: '1.0',
  };
}
