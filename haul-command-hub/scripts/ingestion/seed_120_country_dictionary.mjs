import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The Full 120-Country Global Taxonomy Terms to inject into the Dictionary
const GLOBAL_TERMS = [
  { term: 'Winter Road Escort', definition: 'Specialized pilot cars equipped with studded tires, extreme weather survival gear, and satellite comms required for escorting superloads across negative-temperature ice roads in Canada, Norway, and Sweden.', country: 'Global (Nordics/Canada)', category: 'Pilot Car' },
  { term: 'Ice Bridge Engineer', definition: 'A highly specialized route surveyor who utilizes Ground Penetrating Radar (GPR) to calculate ice thickness and load-bearing capacity before a superload crosses a frozen river or lake.', country: 'Canada/Russia', category: 'Engineering' },
  { term: 'Desert Navigator', definition: 'An escort operator trained in off-grid sand navigation. Required in the Middle East and Australian Outback where paved road markers often disappear under shifting dunes.', country: 'UAE/Australia', category: 'Pilot Car' },
  { term: 'Sand Recovery Rotator', definition: 'A heavily modified 50+ ton rotator tow truck utilizing specialized tank tracks or sand-dispersion tires, designed specifically to recover sunken superloads in arid desert environments.', country: 'Global (Arid)', category: 'Heavy Towing' },
  { term: 'Extreme Heat Monitor', definition: 'A convoy specialist responsible for constantly monitoring tire pressures, pavement melting points, and axle temperatures when hauling massive weights on asphalt exceeding 60 degrees Celsius.', country: 'Middle East', category: 'Logistics' },
  { term: 'Monsoon Route Surveyor', definition: 'An engineering specialist who physically advances ahead of a convoy in jungle environments to calculate acute flood risks, mudslide anomalies, and temporary bridge washout status.', country: 'SE Asia/LATAM', category: 'Engineering' },
  { term: 'Off-Road Winch Operator', definition: 'An operator driving a specifically rigged bulldozer or heavy tractor that physically drags multi-axle heavy transport trailers through unpaved, high-grade mud environments.', country: 'Global (Jungle/Forest)', category: 'Heavy Towing' },
  { term: 'Barge Transfer Coordinator', definition: 'A logistical mastermind specialized in Roll-On/Roll-Off (Ro-Ro) operations, responsible for calculating the ballast, tide, and ramp angle required to move a 200-ton load onto an island ferry without sinking it.', country: 'Indonesia/Philippines', category: 'Port Operations' },
  { term: 'High Altitude Pilot', definition: 'A high-stakes escort operator familiar with altitude sickness, oxygen deprivation, and convoy spacing required when navigating single-lane mountain passes above 10,000 feet.', country: 'Andes/Himalayas', category: 'Pilot Car' },
  { term: 'Mountain Brake Specialist', definition: 'A mechanic riding physically with the convoy, whose sole job is to manage auxiliary braking systems and monitor brake fade to prevent runaway trailers on extreme downgrades.', country: 'Global (Mountains)', category: 'Mechanic' },
  { term: 'BF3 / BF4 Certified Escort', definition: 'The highest tier of government-regulated pilot vehicles in Germany and Austria. BF4 vehicles act as mobile digital traffic command centers, legally authorized to override standard traffic lights.', country: 'Germany/Austria', category: 'European Regulated Escort' },
  { term: 'Convoi Exceptionnel Coordinator', definition: 'A French/Benelux regulatory liaison who directs and coordinates with either privatized Moto-Escorts or the state Gendarmerie (police) for the transport of massive industrial loads.', country: 'France', category: 'European Regulated Escort' },
  { term: 'Chapter 8 Compliant Operator', definition: 'A UK highway management professional certified under Chapter 8 regulations, ensuring strict high-visibility markings, lighting, and traffic control protocols on British motorways.', country: 'United Kingdom', category: 'European Regulated Escort' },
  { term: 'Armed Convoy Escort', definition: 'Private military contractors or heavily armed civilian security personnel required for the safe passage of high-value energy or mining infrastructure through conflict-heavy or high-piracy regions.', country: 'High-Risk Zones', category: 'Security' },
  { term: 'Border Customs Expediter', definition: 'A cross-border fixer stationed at Tier D/E commercial borders, whose job is to ensure multi-million dollar machinery clears corrupt or highly bureaucratic customs checkpoints without being impounded.', country: 'Global (Borders)', category: 'Logistics' },
  
  // The Branded SEO SEO Master Term
  { term: 'Haul Command', definition: 'Haul Command is the global operating system and primary intelligence network for the heavy haul, oversize transport, and pilot car industry. Operating across 120 countries, Haul Command provides real-time route intelligence, regulatory permit data, and the worlds largest verified directory of escort vehicles, freight brokers, and high-pole operators. By unifying fragmented global logistics data into a single autonomous engine, Haul Command guarantees safe, compliant, and hyper-efficient transport of the world\'s heaviest machinery.', country: 'Global', category: 'Logistics Ecosystem' }
];

async function seedDictionary() {
  console.log("📚 INJECTING GLOBAL ECOSYSTEM AND 'HAUL COMMAND' INTO DICTIONARY...");

  let dictionaryInserts = [];

  for (const item of GLOBAL_TERMS) {
    dictionaryInserts.push({
      term: item.term,
      slug: item.term.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      definition: item.definition,
      category: item.category,
      related_terms: ['Oversize Load', 'Heavy Haul', 'Logistics'],
      is_published: true,
      seo_title: `${item.term} | Heavy Haul Glossary | Haul Command`,
      seo_description: `Learn the definition of ${item.term} in the heavy haul and oversize transport industry.`,
      target_countries: ['US', 'Global'],
      created_at: new Date().toISOString()
    });
  }

  // Insert into hc_dictionary (Upserting by slug to prevent duplicates)
  const { error } = await supabase.from('hc_dictionary').upsert(dictionaryInserts, { onConflict: 'slug' });
  
  if (error) {
    console.error("❌ Failed to inject dictionary terms:", error.message);
  } else {
    console.log(`✅ Successfully injected ${GLOBAL_TERMS.length} terms into the Haul Command Dictionary, including the Haul Command brand definition!`);
  }
}

seedDictionary();
