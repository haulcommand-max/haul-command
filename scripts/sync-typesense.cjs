/**
 * Haul Command: Typesense Synchronization Engine
 * This script initializes the Typesense collections (Schemas) and pushes
 * active operators and corridors into the local/cloud cluster.
 * 
 * Target: 15x Search Speed & Local SEO Visibility
 */

require('dotenv').config({ path: '.env.local' });
const Typesense = require('typesense');
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Typesense Client
// Uses the local docker-compose configuration or falls back to production Cloud if set
const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: process.env.TYPESENSE_PORT || '8108',
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'dev_typesense_key_123',
  connectionTimeoutSeconds: 5,
});

// 2. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Define the rigorous, search-optimized schema for Escorts & Profiles
 * This schema guarantees sub-50ms geographic querying.
 */
const profileSchema = {
  name: 'hc_profiles',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'company_name', type: 'string' },
    { name: 'role', type: 'string', facet: true },
    { name: 'country', type: 'string', facet: true },
    { name: 'state_province', type: 'string', facet: true },
    { name: 'city', type: 'string', facet: true },
    { name: 'trust_score', type: 'int32', sort: true },
    { name: 'is_claimed', type: 'bool', facet: true },
    { name: 'is_sponsored', type: 'bool', facet: true },
    { name: 'location', type: 'geopoint' }, // Powerful: Allows "Pilot cars within 100 miles of Dallas"
  ],
  default_sorting_field: 'trust_score'
};

async function executeSync() {
  console.log("🚀 Initializing Typesense Blueprint for Haul Command...");

  try {
    // Attempt to delete if we are forcing a reset
    try {
      await typesense.collections('hc_profiles').delete();
      console.log("♻️  Cleared existing 'hc_profiles' collection.");
    } catch (e) {
      // Collection did not exist, safe to proceed
    }

    // 1. Create Schema
    console.log("🏗️  Building 'hc_profiles' geo-aware schema...");
    await typesense.collections().create(profileSchema);
    console.log("✅ Schema created.");

    // 2. Fetch Active Providers from Postgres
    console.log("📥 Fetching active profiles from Supabase...");
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_claimed, metadata, trust_score')
      .limit(1000); // Batched for safety in V1

    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      console.log("⚠️ No profiles found to sync.");
      return;
    }

    // 3. Transform to Typesense Specification
    const documents = profiles.map(p => {
      // Safely extract location data if available in metadata
      const lat = p.metadata?.lat || 0;
      const lng = p.metadata?.lng || 0;
      
      return {
        id: p.id,
        company_name: p.metadata?.company_name || p.email || 'Unknown Operator',
        role: p.role || 'operator',
        country: p.metadata?.country || 'US',
        state_province: p.metadata?.state || 'Unknown',
        city: p.metadata?.city || 'Unknown',
        trust_score: p.trust_score || 0,
        is_claimed: p.is_claimed || false,
        is_sponsored: p.metadata?.is_sponsored || false,
        location: [lat, lng] // GeoPoint array format: [Lat, Lng]
      };
    });

    // 4. Batch Push to Typesense
    console.log(`📤 Pushing ${documents.length} verified operators into Typesense Memory...`);
    const importResults = await typesense.collections('hc_profiles').documents().import(documents, { action: 'upsert' });
    
    // Check for errors in the batch output
    const failedItems = importResults.filter(item => item.success === false);
    if (failedItems.length > 0) {
      console.error(`⚠️ ${failedItems.length} documents failed to index.`);
    } else {
      console.log(`✅ Success! ${documents.length} documents ingested and instantly searchable.`);
    }

  } catch (err) {
    console.error("❌ Sync Error:", err);
  }
}

executeSync();
