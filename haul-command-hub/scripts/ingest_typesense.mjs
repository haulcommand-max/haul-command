import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Typesense configuration
const TYPESENSE_HOST = process.env.TYPESENSE_HOST || 'localhost';
const TYPESENSE_PORT = process.env.TYPESENSE_PORT || '8108';
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'http';
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'dev_typesense_key_123';

const typesenseUrl = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}`;

// Schema for provider_directory inside Typesense
const schema = {
  name: 'provider_directory',
  fields: [
    { name: '.*', type: 'auto' },
    { name: 'slug', type: 'string', facet: false },
    { name: 'display_name', type: 'string', sort: true },
    { name: 'city', type: 'string', facet: true },
    { name: 'state', type: 'string', facet: true },
    { name: 'service_tags', type: 'string[]', facet: true },
    { name: 'coverage_status', type: 'string', facet: true },
    { name: 'verified', type: 'bool', facet: true },
    { name: 'location', type: 'geopoint', optional: true }
  ]
};

async function initTypesense() {
  console.log(`[Typesense] Initializing schema "provider_directory" at ${typesenseUrl}...`);
  try {
    let res = await fetch(`${typesenseUrl}/collections/provider_directory`, {
      method: 'DELETE',
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY }
    });
    
    res = await fetch(`${typesenseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY
      },
      body: JSON.stringify(schema)
    });
    if (!res.ok) {
      console.warn(`[Typesense] Collection creation warning:`, await res.text());
    } else {
      console.log(`[Typesense] Collection created successfully.`);
    }
  } catch (err) {
    console.error(`[Typesense] Network Error:`, err.message);
    console.warn(`Is Typesense running on ${typesenseUrl} ?`);
  }
}

async function bulkIngest() {
  console.log(`\n[Ingestion] Starting bulk sync from Supabase \`provider_directory\`...`);
  const batchSize = 250; 
  let offset = 0;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    const { data: rows, error } = await supabase
      .from('provider_directory')
      .select('id, slug, display_name, state, city, service_tags, phone, coverage_status, verified, lat, lng')
      .in('coverage_status', ['live', 'onboarding'])
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error(`[Ingestion] Supabase error:`, error.message);
      break;
    }

    if (!rows || rows.length === 0) {
      hasMore = false;
      break;
    }

    const jsonl = rows.map(row => {
      const doc = {
        id: row.id,
        slug: row.slug || "",
        display_name: row.display_name || "",
        state: row.state || "",
        city: row.city || "",
        service_tags: row.service_tags || [],
        coverage_status: row.coverage_status || "coming_soon",
        verified: row.verified ?? false,
        phone: row.phone || ""
      };
      if (row.lat && row.lng) {
        doc.location = [parseFloat(row.lat), parseFloat(row.lng)];
      }
      return JSON.stringify(doc);
    }).join('\n');

    try {
      const res = await fetch(`${typesenseUrl}/collections/provider_directory/documents/import?action=upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY
        },
        body: jsonl
      });
      
      const resText = await res.text();
      if (!res.ok) {
        console.error(`[Ingestion] Typesense error chunk:`, resText.substring(0, 200));
      } else {
        totalProcessed += rows.length;
        console.log(`[Ingestion] Loaded ${totalProcessed} records (e.g. ${rows[0].display_name})...`);
      }
    } catch (err) {
      console.error(`[Ingestion] Failed to import batch to Typesense:`, err.message);
      break;
    }

    offset += batchSize;
  }
  console.log(`\n[Ingestion] Sync Complete! Total operators pushed to Typesense: ${totalProcessed}`);
}

async function run() {
  await initTypesense();
  await bulkIngest();
}

run();
