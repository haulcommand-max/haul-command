/**
 * HAUL COMMAND — Ingestion Runner
 * Seeds the ingestion queue with queries from the geo expansion engine,
 * then kicks off distributed workers.
 * 
 * Usage: npx tsx scripts/runIngestion.ts [--tier A] [--country US] [--dry-run]
 */
import { generateAllQueries, generateQueriesForCountry, ALL_COUNTRIES, estimateYield } from '../packages/ingestion/geo-expansion';
import { processQuery } from '../packages/ingestion/worker';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const tierFilter = args.find(a => a.startsWith('--tier'))?.split(' ')[1] || args[args.indexOf('--tier') + 1];
const countryFilter = args.find(a => a.startsWith('--country'))?.split(' ')[1] || args[args.indexOf('--country') + 1];
const dryRun = args.includes('--dry-run');

async function main() {
  console.log('🚀 HAUL COMMAND INGESTION RUNNER');
  console.log('════════════════════════════════════════════════════');

  // Generate queries
  let queries = generateAllQueries();

  if (tierFilter) {
    queries = queries.filter(q => q.tier === tierFilter);
    console.log(`📋 Filtered to Tier ${tierFilter}`);
  }

  if (countryFilter) {
    queries = queries.filter(q => q.countryCode === countryFilter);
    console.log(`📋 Filtered to country: ${countryFilter}`);
  }

  // Estimate yields
  const estimate = estimateYield(queries);
  console.log(`\n📊 YIELD ESTIMATE:`);
  console.log(`   Total queries: ${estimate.totalQueries}`);
  console.log(`   Estimated operators: ${estimate.estimatedOperators.toLocaleString()}`);
  console.log(`   Estimated API cost: $${estimate.estimatedCostUsd}`);
  console.log(`\n   By Tier:`);
  for (const [tier, data] of Object.entries(estimate.byTier)) {
    console.log(`     Tier ${tier}: ${data.queries} queries → ~${Math.round(data.estimatedOperators)} operators`);
  }

  if (dryRun) {
    console.log('\n🏁 DRY RUN complete. No queries executed.');
    console.log(`   Would seed ${queries.length} jobs into ingestion_queue.`);
    return;
  }

  // Seed queue
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  console.log(`\n📥 Seeding ${queries.length} jobs into ingestion_queue...`);

  const batchSize = 100;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize).map(q => ({
      query: q.query,
      country_code: q.countryCode,
      region: q.type,
      tier: q.tier,
      status: 'pending',
      attempts: 0,
      results_count: 0,
    }));

    const { error } = await supabase.from('ingestion_queue').insert(batch);
    if (error) {
      console.error(`❌ Batch insert error:`, error.message);
    }

    const pct = Math.round(((i + batchSize) / queries.length) * 100);
    process.stdout.write(`\r   Progress: ${Math.min(pct, 100)}%`);
  }

  console.log(`\n\n✅ Queue seeded with ${queries.length} jobs.`);
  console.log('🔧 Run distributed workers with: npx tsx packages/ingestion/worker.ts');
}

main().catch(console.error);
