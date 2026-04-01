import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeEntitySlug(name, city, state) {
  const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!city || !state) return cleanName;
  const cleanCity = city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${cleanName}-${cleanCity}-${state.toLowerCase()}`.substring(0, 100);
}

const PAGE_SIZE = 500;

async function runConsolidation() {
  console.log("🚀 Starting TSAS to hc_public_operators API Consolidation...");

  let page = 0;
  let totalProcessed = 0;
  let successCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  const categoryMap = {
    'Pilot Car': 'pilot_car_operator',
    'Pilot Car Operators': 'pilot_car_operator',
    'Escort Operator': 'pilot_car_operator',
    'Pilot Driver': 'pilot_car_operator',
    'Pole Car': 'pole_car_operator',
    'Route Survey': 'route_surveyor',
    'Heavy Haul Trucking': 'heavy_haul_carrier',
    'Oversize Load Carrier': 'heavy_haul_carrier'
  };

  try {
    while (true) {
      console.log(`📥 Fetching TSAS chunk (offset: ${page * PAGE_SIZE})...`);
      const { data: tsasOps, error } = await supabase
        .from('hc_source_tsas')
        .select('*')
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw new Error(`Fetch failed: ${error.message}`);
      if (!tsasOps || tsasOps.length === 0) break;

      totalProcessed += tsasOps.length;

      // Filter and Map payloads
      const mappedOps = [];
      for (const op of tsasOps) {
        let canonicalType = categoryMap[op.hc_entity_type] || 'pilot_car_operator';
        if ((op.hc_entity_type || '').toLowerCase().includes('heavy')) canonicalType = 'heavy_haul_carrier';
        if ((op.hc_entity_type || '').toLowerCase().includes('pole')) canonicalType = 'pole_car_operator';

        const name = op.name_normalized || op.name;
        // Clean phone (handle + prefix format)
        let cleanPhone = op.phone_primary ? op.phone_primary.replace(/[^0-9]/g, '') : null;
        if (cleanPhone && !cleanPhone.startsWith('1')) cleanPhone = '+1' + cleanPhone;
        else if (cleanPhone && cleanPhone.startsWith('1')) cleanPhone = '+' + cleanPhone;

        let slug = normalizeEntitySlug(name, op.city, op.admin1_code);

        mappedOps.push({
          name: name,
          slug: slug,
          entity_type: canonicalType,
          city: op.city,
          state_code: op.admin1_code,
          country_code: op.country_code || 'US',
          phone: cleanPhone,
          email: op.email,
          website: op.website_url,
          trust_classification: 'source_scrape_tsas',
          claim_status: 'unclaimed',
          source_system: 'tsas_competitive_scrape'
        });
      }

      // Upsert to handle unique constraints elegantly
      const { data, error: insertError } = await supabase
        .from('hc_public_operators')
        .upsert(mappedOps, { onConflict: 'slug', ignoreDuplicates: true })
        .select('id');

      if (insertError) {
        console.error(`   ❌ Chunk Upsert failed:`, insertError.message);
        errorCount += mappedOps.length;
      } else {
        const newlyInserted = data ? data.length : 0;
        successCount += newlyInserted;
        duplicateCount += (mappedOps.length - newlyInserted);
        console.log(`   ✅ Chunk Complete | Inserted: ${newlyInserted} | Skipped Dups: ${mappedOps.length - newlyInserted}`);
      }

      if (tsasOps.length < PAGE_SIZE) break;
      page++;
    }

    console.log(`\n🎉 Consolidation Complete!`);
    console.log(`   🔸 Total TSAS Records Processed: ${totalProcessed}`);
    console.log(`   ✅ Successfully Merged: ${successCount}`);
    console.log(`   ⏭  Duplicates Ignored: ${duplicateCount}`);
    console.log(`   ❌ Errors Count: ${errorCount}`);

  } catch (err) {
    console.error("FATAL ERROR during pipeline execution:", err);
  }
}

runConsolidation();
