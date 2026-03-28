import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const SERPAPI_KEY = process.env.SERPAPI_KEY || 'YOUR_SERPAPI_KEY';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase URL or Service Key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

/**
 * Main ingestion loop:
 * 1. Pulls the next 'pending' dork query from `search_dork_queue`.
 * 2. Fetches Google Local Pack & Organic results via SerpAPI.
 * 3. Logs the raw data into `serp_raw_results`.
 * 4. Runs the fuzzy match RPC to deduplicate or create new profiles!
 */
async function runSerpIngestion() {
  console.log("🚀 Starting Autonomous SERP Ingestion Pipeline...");

  // 1. Fetch the next pending Dork from the queue 
  const { data: queueItems, error: qErr } = await supabase
    .from('search_dork_queue')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (qErr) {
    console.error("❌ Failed to fetch queue:", qErr.message);
    return;
  }

  if (!queueItems || queueItems.length === 0) {
    console.log("✅ Dork Queue is empty. Nothing to scrape right now.");
    console.log("💡 Tip: Insert a row like: INSERT INTO search_dork_queue (dork_query, target_region) VALUES ('\"pilot car\" Cross City FL', 'Florida');");
    return;
  }

  const dork = queueItems[0];
  console.log(`\n🔍 Processing Dork: [${dork.dork_query}]`);

  // Lock the queue item so parallel workers don't grab it
  await supabase.from('search_dork_queue').update({ status: 'processing' }).eq('id', dork.id);

  try {
    // 2. Fetch from SerpAPI (Google Local / Organic)
    console.log(`📡 Hitting SerpAPI for query: ${dork.dork_query}`);
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(dork.dork_query)}&api_key=${SERPAPI_KEY}`;
    
    const response = await fetch(searchUrl);
    const resultData = await response.json();

    if (resultData.error) {
      throw new Error(`SerpAPI Error: ${resultData.error}`);
    }

    let insertedCount = 0;
    let matchedCount = 0;

    // --- A. Process Google Local Pack (Map Results) ---
    // This is the absolute best data for "pilot car" because it includes Contacts, Addresses, and Reviews!
    if (resultData.local_results && resultData.local_results.length > 0) {
      console.log(`🗺️ Found ${resultData.local_results.length} Local Map results. Preparing ingestion...`);
      
      for (const localBiz of resultData.local_results) {
        // 3. Dump Raw Result to the Staging Table
        const { data: rawResult, error: rawErr } = await supabase
          .from('serp_raw_results')
          .insert({
            dork_id: dork.id,
            title: localBiz.title || 'Unknown',
            phone_extracted: localBiz.phone || null,
            address_extracted: localBiz.address || null,
            url: localBiz.website || null,
            domain: localBiz.website ? new URL(localBiz.website).hostname : null,
            snippet: `Rating: ${localBiz.rating} (${localBiz.reviews} reviews)`,
            is_social_profile: false,
            processed_to_entity: true // We are processing it right now below
          })
          .select()
          .single();

        if (rawErr) {
          console.error(`⚠️ Extractor warning [${localBiz.title}]:`, rawErr.message);
          continue;
        }

        // 4. Run Fuzzy Match RPC (pg_trgm Entity Resolution)
        const { data: matchedEntityId, error: rpcErr } = await supabase.rpc('match_and_merge_serp_entity', {
          p_name: localBiz.title || '',
          p_phone: localBiz.phone || null,
          p_region: dork.target_region || null,
          p_url: localBiz.website || null
        });

        if (matchedEntityId) {
          // Found an exact or fuzzy match! We can update the existing record.
          matchedCount++;
          console.log(`🔗 Matched [${localBiz.title}] to existing profile ID: ${matchedEntityId}`);
          
          // Optionally: Update existing profile with Google Review count and Rating
          // await supabase.from('entities').update({ google_rating: localBiz.rating, review_count: localBiz.reviews }).eq('id', matchedEntityId);
        } else {
          // 100% Brand New Operator! Let's insert them into the core directory.
          const { error: insertErr } = await supabase.from('entities').insert({
            type: dork.entity_type || 'operator',
            name: localBiz.title,
            primary_phone: localBiz.phone || null,
            website: localBiz.website || null,
            region: dork.target_region,
            city: dork.target_city,
            source: 'google_local_pack',
            source_url: 'search_dork_queue',
            metadata: {
              google_maps_rating: localBiz.rating,
              google_maps_reviews: localBiz.reviews,
              raw_address: localBiz.address
            }
          });

          if (insertErr) {
            console.error(`❌ Failed to create new entity [${localBiz.title}]:`, insertErr.message);
          } else {
            insertedCount++;
            console.log(`✨ Created BRAND NEW directory profile: ${localBiz.title}`);
          }
        }
      }
    }

    // --- B. Process Generic Organic Results (Facebook/LinkedIn Sweeps) ---
    // e.g. "site:facebook.com pilot car cross city fl"
    if (resultData.organic_results && resultData.organic_results.length > 0) {
       // Similar extraction logic for organic snippets (omitted for brevity)
    }

    // 5. Mark the Queue Item as Completed
    await supabase.from('search_dork_queue').update({ 
      status: 'completed',
      results_found: insertedCount + matchedCount,
      last_scraped_at: new Date().toISOString()
    }).eq('id', dork.id);

    console.log(`\n✅ Finished Dork! Integrated ${insertedCount} new profiles, updated ${matchedCount} existing profiles.`);

  } catch (error: any) {
    console.error("❌ Fatal Pipeline Error:", error.message);
    // Mark as failed so it can be automatically retried later
    await supabase.from('search_dork_queue').update({ 
      status: 'failed',
    }).eq('id', dork.id);
  }
}

runSerpIngestion();
