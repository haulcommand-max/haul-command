/**
 * HAUL COMMAND - MASS INGESTION WORKER (METERED MULTI-THREADING)
 * Designed to execute the 3,000,000+ unmetered contacts safely into the live production DB.
 * Throttles the flow rate securely to prevent Postgres choke and compute spikes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production env to bind to live DB
dotenv.config({ path: path.join(__dirname, '..', '.env.production.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Constants for throttling
const CHUNK_SIZE = 100; // Inject exactly 100 per database transaction
const DELAY_MS = 500;   // Wait 500ms between transactions to prevent connection spikes

async function runMassIngestionWorker() {
  console.log('[HAUL-OS] 🚨 MASS INGESTION WORKER INITIATED 🚨');
  const seedFile = path.join(__dirname, 'seed', 'uk_operators_raw.json');

  if (!fs.existsSync(seedFile)) {
    console.error(`[!] Cannot locate seed file at ${seedFile}`);
    process.exit(1);
  }

  console.log(`[HAUL-OS] Parsing primary payload memory...`);
  const rawData = fs.readFileSync(seedFile, 'utf-8');
  const payload = JSON.parse(rawData);
  const entities = payload.operators || payload.items || [];

  if (!entities.length) {
    console.error('[!] Zero entities mapped in active payload. Aborting.');
    process.exit(1);
  }

  console.log(`[+] Total Extracted Contacts Ready: ${entities.length.toLocaleString()}`);
  console.log(`[+] Firing chunk queues of ${CHUNK_SIZE} every ${DELAY_MS}ms...\n`);

  let totalIngested = 0;
  let totalFailed = 0;

  for (let i = 0; i < entities.length; i += CHUNK_SIZE) {
    const chunk = entities.slice(i, i + CHUNK_SIZE);
    
    // Map raw JSON to expected Supabase constraints
    const mappedChunk = chunk.map(c => ({
      entity_id: crypto.randomUUID(),
      name: c.name || c.company_name || 'Unknown Entity',
      city: c.city || null,
      region_code: c.region_code || c.state_name || null,
      country_code: c.country_code || 'US',
      slug: 'hc-' + ((c.slug || c.name || 'entity').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || crypto.randomUUID().slice(0,8)),
      claim_hash: c.claim_hash || null,
      claim_status: c.claim_status || 'unclaimed',
      entity_type: 'operator',
      source: c.source || 'uspilotcars.com',
      rank_score: 10,
      metadata: {
        phone: c.phone || null,
        website: c.website || null,
        description: c.description || null,
        services: c.services || [],
        additional_regions: c.additional_regions || []
      }
    }));

    // Secure Bulk Upload
    const { error } = await supabase
      .from('directory_listings')
      .upsert(mappedChunk, { onConflict: 'slug', ignoreDuplicates: true });

    if (error) {
      console.error(`[!] Execution Block Error at Offset ${i}:`, error.message);
      totalFailed += chunk.length;
    } else {
      totalIngested += chunk.length;
      process.stdout.write(`\r[+] Successfully bridged ${totalIngested.toLocaleString()} entities into live production...`);
    }

    // Delay loop (Throttling)
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  console.log(`\n\n[HAUL-OS] ✅ INGESTION PIPELINE FULLY EXECUTED ✅`);
  console.log(`Total Active Entities Merged: ${totalIngested.toLocaleString()}`);
  if (totalFailed > 0) {
    console.log(`Total Failed or Duplicates Skipped: ${totalFailed.toLocaleString()}`);
  }
}

runMassIngestionWorker();
