/**
 * Compliance Copilot Cache Seeder — GLOBAL COUNTRIES
 * 
 * Seeds the copilot_cache Supabase table with Claude-generated
 * compliance answers for all 120 countries (minus US states already done).
 * 
 * Each country gets 4 questions:
 * 1. Do I need an escort/pilot car in {country}?
 * 2. What are the oversize load limits in {country}?
 * 3. What equipment is required for escort vehicles in {country}?
 * 4. What permit system does {country} use for oversize loads?
 * 
 * Run: npx tsx scripts/seed-copilot-global.ts
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashQuestion(q: string): string {
  return crypto.createHash('sha256').update(q.toLowerCase().trim()).digest('hex');
}

interface Country {
  code: string;
  name: string;
  tier: string;
  localTerm: string;
  authority: string;
}

const COUNTRIES: Country[] = [
  // Tier A — Gold
  { code: 'US', name: 'United States', tier: 'A', localTerm: 'pilot car', authority: 'State DOT (each state)' },
  { code: 'CA', name: 'Canada', tier: 'A', localTerm: 'pilot car', authority: 'Provincial transport ministries' },
  { code: 'AU', name: 'Australia', tier: 'A', localTerm: 'pilot vehicle', authority: 'National Heavy Vehicle Regulator (NHVR)' },
  { code: 'GB', name: 'United Kingdom', tier: 'A', localTerm: 'escort vehicle', authority: 'Department for Transport / Highways England' },
  { code: 'NZ', name: 'New Zealand', tier: 'A', localTerm: 'load pilot', authority: 'NZ Transport Agency (NZTA)' },
  { code: 'ZA', name: 'South Africa', tier: 'A', localTerm: 'escort vehicle', authority: 'Provincial Road Traffic Authorities' },
  { code: 'DE', name: 'Germany', tier: 'A', localTerm: 'Begleitfahrzeug', authority: 'State road authorities via VEMAGS' },
  { code: 'NL', name: 'Netherlands', tier: 'A', localTerm: 'begeleidingsvoertuig', authority: 'RDW (Netherlands Vehicle Authority)' },
  { code: 'AE', name: 'United Arab Emirates', tier: 'A', localTerm: 'escort vehicle', authority: 'Ministry of Interior / Emirate transport authorities' },
  { code: 'BR', name: 'Brazil', tier: 'A', localTerm: 'carro batedor', authority: 'DNIT / ANTT' },
  // Tier B — Blue
  { code: 'IE', name: 'Ireland', tier: 'B', localTerm: 'escort vehicle', authority: 'An Garda Síochána / Local authorities' },
  { code: 'SE', name: 'Sweden', tier: 'B', localTerm: 'eskortfordon', authority: 'Transportstyrelsen' },
  { code: 'NO', name: 'Norway', tier: 'B', localTerm: 'følgebil', authority: 'Statens vegvesen' },
  { code: 'DK', name: 'Denmark', tier: 'B', localTerm: 'ledsagebil', authority: 'Danish Road Directorate' },
  { code: 'FI', name: 'Finland', tier: 'B', localTerm: 'saattoauto', authority: 'Traficom' },
  { code: 'BE', name: 'Belgium', tier: 'B', localTerm: 'begeleidingsvoertuig', authority: 'Regional transport authorities' },
  { code: 'AT', name: 'Austria', tier: 'B', localTerm: 'Begleitfahrzeug', authority: 'Provincial authorities (Landeshauptmann)' },
  { code: 'CH', name: 'Switzerland', tier: 'B', localTerm: 'Begleitfahrzeug', authority: 'ASTRA (Federal Roads Office)' },
  { code: 'ES', name: 'Spain', tier: 'B', localTerm: 'vehículo de acompañamiento', authority: 'DGT (Dirección General de Tráfico)' },
  { code: 'FR', name: 'France', tier: 'B', localTerm: 'véhicule d\'accompagnement', authority: 'Préfecture / DREAL' },
  { code: 'IT', name: 'Italy', tier: 'B', localTerm: 'veicolo di scorta', authority: 'Provincial Road Administration' },
  { code: 'PT', name: 'Portugal', tier: 'B', localTerm: 'veículo de acompanhamento', authority: 'IMT' },
  { code: 'SA', name: 'Saudi Arabia', tier: 'B', localTerm: 'escort vehicle', authority: 'General Authority for Transport (GAT)' },
  { code: 'QA', name: 'Qatar', tier: 'B', localTerm: 'escort vehicle', authority: 'Public Works Authority (Ashghal)' },
  { code: 'MX', name: 'Mexico', tier: 'B', localTerm: 'carro piloto', authority: 'SCT' },
  { code: 'IN', name: 'India', tier: 'B', localTerm: 'escort vehicle', authority: 'NHAI / State PWD' },
  { code: 'ID', name: 'Indonesia', tier: 'B', localTerm: 'kendaraan pengawal', authority: 'Ministry of Transportation' },
  { code: 'TH', name: 'Thailand', tier: 'B', localTerm: 'escort vehicle', authority: 'Department of Land Transport' },
  // Tier C — Silver
  { code: 'PL', name: 'Poland', tier: 'C', localTerm: 'pojazd pilotujący', authority: 'GITD' },
  { code: 'CZ', name: 'Czech Republic', tier: 'C', localTerm: 'doprovodné vozidlo', authority: 'Road Administration' },
  { code: 'SK', name: 'Slovakia', tier: 'C', localTerm: 'sprievodné vozidlo', authority: 'Slovak Road Administration' },
  { code: 'HU', name: 'Hungary', tier: 'C', localTerm: 'kísérő jármű', authority: 'Magyar Közút' },
  { code: 'SI', name: 'Slovenia', tier: 'C', localTerm: 'spremno vozilo', authority: 'Slovenian Infrastructure Agency' },
  { code: 'EE', name: 'Estonia', tier: 'C', localTerm: 'saatesõiduk', authority: 'Road Administration' },
  { code: 'LV', name: 'Latvia', tier: 'C', localTerm: 'pavadošais transportlīdzeklis', authority: 'Road Administration' },
  { code: 'LT', name: 'Lithuania', tier: 'C', localTerm: 'lydintysis automobilis', authority: 'Road Administration' },
  { code: 'HR', name: 'Croatia', tier: 'C', localTerm: 'pratno vozilo', authority: 'Hrvatske ceste' },
  { code: 'RO', name: 'Romania', tier: 'C', localTerm: 'vehicul de însoțire', authority: 'CNAIR' },
  { code: 'BG', name: 'Bulgaria', tier: 'C', localTerm: 'ескортно превозно средство', authority: 'Road Infrastructure Agency' },
  { code: 'GR', name: 'Greece', tier: 'C', localTerm: 'όχημα συνοδείας', authority: 'Ministry of Infrastructure and Transport' },
  { code: 'TR', name: 'Turkey', tier: 'C', localTerm: 'refakat aracı', authority: 'KGM (General Directorate of Highways)' },
  { code: 'KW', name: 'Kuwait', tier: 'C', localTerm: 'escort vehicle', authority: 'Ministry of Interior' },
  { code: 'OM', name: 'Oman', tier: 'C', localTerm: 'escort vehicle', authority: 'Transport Authority' },
  { code: 'BH', name: 'Bahrain', tier: 'C', localTerm: 'escort vehicle', authority: 'Transport Ministry' },
  { code: 'SG', name: 'Singapore', tier: 'C', localTerm: 'escort vehicle', authority: 'Land Transport Authority (LTA)' },
  { code: 'MY', name: 'Malaysia', tier: 'C', localTerm: 'kenderaan pengiring', authority: 'JPJ (Road Transport Department)' },
  { code: 'JP', name: 'Japan', tier: 'C', localTerm: '誘導車', authority: 'MLIT' },
  { code: 'KR', name: 'South Korea', tier: 'C', localTerm: '유도차량', authority: 'MOLIT' },
  { code: 'CL', name: 'Chile', tier: 'C', localTerm: 'vehículo de escolta', authority: 'Ministry of Transport' },
  { code: 'AR', name: 'Argentina', tier: 'C', localTerm: 'vehículo de escolta', authority: 'Vialidad Nacional' },
  { code: 'CO', name: 'Colombia', tier: 'C', localTerm: 'vehículo escolta', authority: 'Ministry of Transport' },
  { code: 'PE', name: 'Peru', tier: 'C', localTerm: 'vehículo de escolta', authority: 'SUTRAN / Provías Nacional' },
  { code: 'VN', name: 'Vietnam', tier: 'C', localTerm: 'xe dẫn đường', authority: 'Ministry of Transport' },
  { code: 'PH', name: 'Philippines', tier: 'C', localTerm: 'escort vehicle', authority: 'LTO / DPWH' },
  // Tier D — Slate
  { code: 'UY', name: 'Uruguay', tier: 'D', localTerm: 'vehículo escolta', authority: 'Dirección Nacional de Vialidad' },
  { code: 'PA', name: 'Panama', tier: 'D', localTerm: 'vehículo escolta', authority: 'Ministry of Public Works' },
  { code: 'CR', name: 'Costa Rica', tier: 'D', localTerm: 'vehículo escolta', authority: 'MOPT' },
];

const QUESTION_TEMPLATES = [
  (c: Country) => `Do I need a ${c.localTerm} in ${c.name}? When is one required?`,
  (c: Country) => `What are the oversize load dimension limits in ${c.name}? Width, height, length, weight.`,
  (c: Country) => `What equipment is required for escort vehicles (${c.localTerm}) in ${c.name}?`,
  (c: Country) => `How does the permit system work for oversize loads in ${c.name}? Which authority issues permits?`,
];

const systemPrompt = `You are the Haul Command Compliance Copilot — the world's leading expert on pilot car, escort vehicle, and oversize load regulations across all countries. You provide accurate, structured, actionable answers to operators moving oversized freight globally.

When answering about a specific country:
- Use the local terminology for escort/pilot vehicles
- Reference the actual regulatory authority by name
- Include specific dimension thresholds when known (meters, tonnes)
- Mention certification requirements if applicable
- Note equipment requirements (signs, lights, radios)
- Include travel restrictions (night, weekend, holiday)
- If data confidence is low, say so explicitly and recommend contacting the authority directly
- Always end with a safety reminder

Format: Use markdown with headers, bullet points, and bold for key thresholds.`;

async function callClaude(question: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function main() {
  console.log('🌍 Global Compliance Copilot Cache Seeder');
  console.log(`   ${COUNTRIES.length} countries × ${QUESTION_TEMPLATES.length} templates = ${COUNTRIES.length * QUESTION_TEMPLATES.length} questions\n`);

  let seeded = 0, skipped = 0, failed = 0;

  for (const country of COUNTRIES) {
    for (let qi = 0; qi < QUESTION_TEMPLATES.length; qi++) {
      const question = QUESTION_TEMPLATES[qi](country);
      const jurisdictionCode = country.code;
      const hash = hashQuestion(question + jurisdictionCode);

      // Check if already cached
      const { data: existing } = await supabase
        .from('compliance_copilot_cache')
        .select('id')
        .eq('question_hash', hash)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      try {
        const answer = await callClaude(question);

        const { error: insertError } = await supabase
          .from('compliance_copilot_cache')
          .insert({
            question_hash: hash,
            question: question.trim(),
            jurisdiction_code: jurisdictionCode,
            answer_markdown: answer,
            sources: [{
              label: `${country.name} — ${country.authority}`,
              url: `https://www.google.com/search?q=${encodeURIComponent(`${country.name} oversize load escort regulations ${country.authority}`)}`,
            }],
            model_version: 'claude-sonnet-4-20250514',
            tokens_used: 0,
          });

        if (insertError) {
          failed++;
          console.error(`  ❌ ${country.code} Q${qi + 1}: DB error: ${insertError.message?.slice(0, 80)}`);
        } else {
          seeded++;
          console.log(`  ✅ ${country.code} Q${qi + 1}: "${answer.slice(0, 50)}..."`);
        }
      } catch (e: any) {
        failed++;
        console.error(`  ❌ ${country.code} Q${qi + 1}: ${e.message?.slice(0, 80)}`);

        if (e.message?.includes('429') || e.message?.includes('rate')) {
          console.log('  ⏳ Rate limited — waiting 30s...');
          await new Promise(r => setTimeout(r, 30000));
        }
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('📊 GLOBAL SEED SUMMARY');
  console.log('══════════════════════════════════════════════════');
  console.log(`  ✅ Seeded:          ${seeded}`);
  console.log(`  ⏭ Already cached:  ${skipped}`);
  console.log(`  ❌ Failed:          ${failed}`);
  console.log(`  📄 Total processed: ${seeded + skipped + failed}`);
  console.log('══════════════════════════════════════════════════\n');
}

main().catch(console.error);
