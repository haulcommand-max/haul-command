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

async function migratePublicOperators() {
  console.log('🔄 Migrating hc_public_operators...');
  let totalMigrated = 0;
  let page = 0;

  while (true) {
    const { data: publicOps, error } = await supabase
      .from('hc_public_operators')
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch failed: ${error.message}`);
    if (!publicOps || publicOps.length === 0) break;

    const payloads = publicOps.map(op => ({
      source_table: 'hc_public_operators',
      name: op.name,
      slug: op.slug || normalizeEntitySlug(op.name, op.city, op.state_code),
      entity_type: op.entity_type || 'pilot-car',
      country_code: op.country_code || 'US',
      admin1_code: op.state_code,
      city: op.city,
      phone_normalized: op.phone_normalized,
      is_verified: true,
      sync_status: 'migrated'
    }));

    // BATCH INSERT (Upsert based on slug)
    const { error: insertError } = await supabase
      .from('hc_global_operators')
      .upsert(payloads, { onConflict: 'slug', ignoreDuplicates: true });

    if (insertError) {
      console.error(`❌ Batch insert failed: ${insertError.message}`);
    } else {
      totalMigrated += payloads.length;
      console.log(`   ... migrated ${totalMigrated} rows`);
    }

    if (publicOps.length < PAGE_SIZE) break;
    page++;
  }
  console.log(`✅ hc_public_operators migration complete.`);
}

async function migrateTSASOperators() {
  console.log('🔄 Migrating hc_source_tsas...');
  let totalMigrated = 0;
  let page = 0;

  const categoryMap = {
    'Pilot Car': 'pilot-car',
    'Pilot Car Operators': 'pilot-car',
    'Escort Operator': 'pilot-car',
    'Pilot Driver': 'pilot-car',
    'Pole Car': 'pole-car',
    'Route Survey': 'route-survey',
    'Heavy Haul Trucking': 'heavy-haul',
    'Oversize Load Carrier': 'heavy-haul'
  };

  while (true) {
    const { data: tsasOps, error } = await supabase
      .from('hc_source_tsas')
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw new Error(`Fetch failed: ${error.message}`);
    if (!tsasOps || tsasOps.length === 0) break;

    const payloads = tsasOps.map(op => {
      let canonicalType = categoryMap[op.hc_entity_type] || 'pilot-car';
      if ((op.hc_entity_type || '').toLowerCase().includes('heavy')) canonicalType = 'heavy-haul';
      if ((op.hc_entity_type || '').toLowerCase().includes('pole')) canonicalType = 'pole-car';

      const name = op.name_normalized || op.name;
      const cleanPhone = op.phone_primary ? op.phone_primary.replace(/[^0-9]/g, '') : null;
      let slug = normalizeEntitySlug(name, op.city, op.admin1_code);

      return {
        source_table: 'hc_source_tsas',
        source_id: op.source_id ? op.source_id.toString() : null,
        name: name,
        slug: slug,
        entity_type: canonicalType,
        country_code: op.country_code || 'US',
        admin1_code: op.admin1_code,
        city: op.city,
        phone_normalized: cleanPhone,
        email: op.email,
        website_url: op.website_url,
        is_verified: false,
        sync_status: 'migrated'
      };
    });

    const { error: insertError } = await supabase
      .from('hc_global_operators')
      .upsert(payloads, { onConflict: 'slug', ignoreDuplicates: true });

    if (insertError) {
      console.error(`❌ Batch insert failed: ${insertError.message}`);
    } else {
      totalMigrated += payloads.length;
      console.log(`   ... migrated ${totalMigrated} rows`);
    }

    if (tsasOps.length < PAGE_SIZE) break;
    page++;
  }
  console.log(`✅ hc_source_tsas migration complete.`);
}

async function runMasterConsolidation() {
  console.log("🚀 Starting Global Matrix Consolidation (Node API Pipeline)");
  try {
    const { count } = await supabase.from('hc_global_operators').select('*', { count: 'exact', head: true });
    console.log(`📊 Initial hc_global_operators count: ${count || 0}`);

    await migratePublicOperators();
    await migrateTSASOperators();

    const { count: finalCount } = await supabase.from('hc_global_operators').select('*', { count: 'exact', head: true });
    console.log(`🎉 Consolidation Pipeline Finished! Total records in global matrix: ${finalCount}`);
  } catch(e) {
    console.error("FATAL ERROR", e);
  }
}

runMasterConsolidation();
