/**
 * scripts/seed/run-full-pipeline.mjs
 * 
 * MASTER ORCHESTRATOR: Runs the full Anti-Gravity ingestion pipeline end-to-end.
 * 
 * 1. Scrape all 55 state pages from uspilotcars.com
 * 2. Crawl all outbound operator websites for enrichment
 * 3. Merge & deduplicate into unified dataset
 * 4. Export final enriched dataset
 * 5. Attempt Supabase load (if credentials available)
 * 
 * Run: node scripts/seed/run-full-pipeline.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCRIPTS_DIR = path.join(process.cwd(), 'scripts', 'seed');

function log(msg) {
  console.log(`[PIPELINE ${new Date().toISOString().slice(11,19)}] ${msg}`);
}

async function main() {
  const startTime = Date.now();
  log('🚀 ANTI-GRAVITY FULL PIPELINE STARTING');
  log('═══════════════════════════════════════');
  
  // ── PHASE 1: Scrape all state directory pages ──
  log('');
  log('📡 PHASE 1: Full Directory Scrape (55 state/province pages)');
  try {
    execSync(`node ${path.join(SCRIPTS_DIR, 'scrape-all-states.mjs')}`, { 
      cwd: process.cwd(), 
      stdio: 'inherit',
      timeout: 120000 
    });
    log('✅ Phase 1 complete');
  } catch (e) {
    log(`❌ Phase 1 failed: ${e.message}`);
    process.exit(1);
  }
  
  // ── PHASE 2: Crawl outbound operator websites ──
  log('');
  log('🌐 PHASE 2: Outbound Expansion Crawl');
  try {
    execSync(`node ${path.join(SCRIPTS_DIR, 'crawl-outbound-sites.mjs')}`, {
      cwd: process.cwd(),
      stdio: 'inherit',
      timeout: 180000
    });
    log('✅ Phase 2 complete');
  } catch (e) {
    log(`⚠️ Phase 2 failed (non-critical): ${e.message}`);
  }
  
  // ── PHASE 3: Merge & Enrich ──
  log('');
  log('🔀 PHASE 3: Merge & Enrich');
  
  const contactsFile = path.join(DATA_DIR, 'uspilotcars_all_contacts.json');
  const expansionFile = path.join(DATA_DIR, 'outbound_expansion_results.json');
  
  if (!fs.existsSync(contactsFile)) {
    log('❌ Contacts file missing. Aborting.');
    process.exit(1);
  }
  
  const contacts = JSON.parse(fs.readFileSync(contactsFile, 'utf-8'));
  const expansion = fs.existsSync(expansionFile) 
    ? JSON.parse(fs.readFileSync(expansionFile, 'utf-8'))
    : { sites: [] };
  
  // Build enrichment lookup
  const enrichLookup = new Map();
  for (const site of expansion.sites || []) {
    if (site.success && site.url) {
      enrichLookup.set(site.url.toLowerCase().replace(/\/$/, ''), site);
    }
  }
  
  // Enrich operators with expansion data
  let enrichedCount = 0;
  for (const op of contacts.operators || []) {
    if (op.website) {
      const key = op.website.toLowerCase().replace(/\/$/, '');
      const enrichment = enrichLookup.get(key);
      if (enrichment) {
        op.enrichment = {
          emails: enrichment.emails || [],
          socials: enrichment.socials || {},
          title: enrichment.title,
          addresses: enrichment.addresses || [],
          detectedServices: enrichment.detectedServices || [],
          certifications: enrichment.certifications || []
        };
        enrichedCount++;
      }
    }
  }
  
  // Write final enriched dataset
  const finalOutput = {
    meta: {
      ...contacts.meta,
      enrichedOperators: enrichedCount,
      pipelineCompletedAt: new Date().toISOString(),
      totalEmails: expansion.meta?.totalEmailsFound || 0,
      totalSocialProfiles: expansion.meta?.totalSocialProfiles || 0
    },
    operators: contacts.operators,
    outboundWebsites: contacts.outboundWebsites
  };
  
  const finalPath = path.join(DATA_DIR, 'uspilotcars_enriched_final.json');
  fs.writeFileSync(finalPath, JSON.stringify(finalOutput, null, 2));
  
  log(`✅ Phase 3 complete: ${enrichedCount} operators enriched`);
  
  // ── PHASE 4: Attempt Supabase Load ──
  log('');
  log('💾 PHASE 4: Supabase Load');
  
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref');
  
  if (hasSupabase) {
    try {
      execSync(`node ${path.join(SCRIPTS_DIR, 'load-seed-to-supabase.mjs')}`, {
        cwd: process.cwd(),
        stdio: 'inherit',
        timeout: 60000
      });
      log('✅ Phase 4 complete: Data loaded to Supabase');
    } catch (e) {
      log(`⚠️ Phase 4 failed: ${e.message}`);
    }
  } else {
    log('⏭️  Phase 4 skipped: Supabase credentials not configured');
    log('   To load data: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  
  // ── SUMMARY ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const ops = contacts.operators?.length || 0;
  const emails = expansion.meta?.totalEmailsFound || 0;
  const socials = expansion.meta?.totalSocialProfiles || 0;
  
  log('');
  log('═══════════════════════════════════════');
  log('🏁 ANTI-GRAVITY PIPELINE COMPLETE');
  log('═══════════════════════════════════════');
  log(`  ⏱️  Total time: ${elapsed}s`);
  log(`  👥 Operators: ${ops}`);
  log(`  🔗 Enriched: ${enrichedCount}`);
  log(`  📧 Emails: ${emails}`);
  log(`  📱 Social profiles: ${socials}`);
  log(`  📂 Output: data/uspilotcars_enriched_final.json`);
  log('');
}

main();
