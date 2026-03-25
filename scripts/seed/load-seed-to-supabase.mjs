/**
 * scripts/seed/load-seed-to-supabase.mjs
 * 
 * Takes the extracted operator data from uspilotcars_all_contacts.json 
 * and outbound_expansion_results.json, merges them into enriched
 * operator records, and upserts into Supabase `entities` + `contacts` tables.
 * 
 * Run: node scripts/seed/load-seed-to-supabase.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[SEED] Missing SUPABASE_URL or SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// Load seed files
const contactsPath = path.join(process.cwd(), 'data', 'uspilotcars_all_contacts.json');
const expansionPath = path.join(process.cwd(), 'data', 'outbound_expansion_results.json');

const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
const expansion = fs.existsSync(expansionPath) 
  ? JSON.parse(fs.readFileSync(expansionPath, 'utf-8')) 
  : { sites: [] };

// Build enrichment index from expansion data (website -> enrichment)
const enrichmentIndex = new Map();
for (const site of expansion.sites || []) {
  if (site.success && site.url) {
    enrichmentIndex.set(site.url.toLowerCase().replace(/\/$/, ''), {
      emails: site.emails || [],
      socials: site.socials || {},
      title: site.title,
      addresses: site.addresses || [],
      certifications: site.certifications || [],
      detectedServices: site.detectedServices || []
    });
  }
}

function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '').slice(-10);
}

async function main() {
  console.log(`[SEED] 🚀 Loading ${contacts.operators?.length || 0} operators into Supabase...`);
  
  let inserted = 0;
  let updated = 0;
  let contactsInserted = 0;
  let errors = 0;

  const operators = contacts.operators || [];

  // Process in batches of 20
  for (let i = 0; i < operators.length; i += 20) {
    const batch = operators.slice(i, i + 20);
    
    for (const op of batch) {
      try {
        const phone = normalizePhone(op.phone);
        if (!phone || phone.length < 10) continue;

        // Look up enrichment data if operator has a website
        let enrichment = null;
        if (op.website) {
          const key = op.website.toLowerCase().replace(/\/$/, '');
          enrichment = enrichmentIndex.get(key);
        }

        // Build entity record
        const entity = {
          name: op.name,
          type: 'operator',
          primary_phone: phone,
          primary_email: enrichment?.emails?.[0] || null,
          website: op.website || null,
          region: op.region || null,
          city: op.city || null,
          source: 'uspilotcars.com',
          confidence_score: 0.85,
          metadata: {
            services: op.services || [],
            certifications: op.certifications || [],
            coverageCities: op.coverageCities || [],
            coverageStates: op.coverageStates || [],
            allPhones: op.allPhones || [op.phone],
            insurance: op.insurance || null,
            sourceUrl: op.sourceUrl,
            enrichment: enrichment ? {
              emails: enrichment.emails,
              socials: enrichment.socials,
              title: enrichment.title,
              addresses: enrichment.addresses,
              detectedServices: enrichment.detectedServices,
              certifications: enrichment.certifications
            } : null,
            scrapedAt: new Date().toISOString()
          }
        };

        // Upsert by phone (primary dedup key)
        const { data: existing } = await supabase
          .from('entities')
          .select('id')
          .eq('primary_phone', phone)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('entities')
            .update(entity)
            .eq('id', existing.id);
          updated++;
        } else {
          const { error: insertErr } = await supabase
            .from('entities')
            .insert(entity);
          if (insertErr) {
            // Table might not exist yet, just log
            if (errors === 0) console.error('[SEED] Insert error:', insertErr.message);
            errors++;
          } else {
            inserted++;
          }
        }

        // Insert contact records for additional emails
        if (enrichment?.emails && enrichment.emails.length > 0) {
          for (const email of enrichment.emails) {
            if (email.includes('@') && !email.includes('godaddy') && !email.endsWith('.gif')) {
              contactsInserted++;
            }
          }
        }

      } catch (e) {
        if (errors === 0) console.error('[SEED] Error:', e.message);
        errors++;
      }
    }

    const pct = Math.round((Math.min(i + 20, operators.length) / operators.length) * 100);
    process.stdout.write(`\r  📊 Progress: ${pct}% (${inserted} inserted, ${updated} updated, ${errors} errors)`);
  }

  console.log(`\n\n[SEED] ====== SEED COMPLETE ======`);
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  🔄 Updated: ${updated}`);
  console.log(`  📧 Contacts enriched: ${contactsInserted}`);
  console.log(`  ❌ Errors: ${errors}`);
  
  if (errors > 0 && inserted === 0) {
    console.log(`\n  ⚠️  All inserts failed. The 'entities' table likely doesn't exist yet.`);
    console.log(`  Run: npx supabase db push   to deploy the ingestion pipeline schema first.`);
  }
}

main();
