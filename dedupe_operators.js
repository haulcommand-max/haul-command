const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables for local testing
dotenv.config({ path: '.env.production.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.production.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkPhoneNumbers() {
  const content = fs.readFileSync('raw_operators.txt', 'utf-8');
  
  // Regex to match phone numbers (e.g. 605-670-9654, (904)699-0435, 815-474-0171)
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const matches = content.match(phoneRegex) || [];
  
  // Normalize phone numbers (strip anything not a digit, take last 10 digits as standard)
  const normalize = (phone) => {
    let digits = phone.replace(/\D/g, '');
    if (digits.length > 10) digits = digits.slice(-10);
    return digits;
  };

  const rawExtractedSet = Array.from(new Set(matches.map(normalize))).filter(d => d.length === 10);
  console.log(`\n=> Step 1: Extracted ${rawExtractedSet.length} total UNIQUE phone numbers from the raw text payload.`);

  // We check multiple DB tables where legacy/public entities are stored.
  const tablesToCheck = ['provider_directory', 'hc_public_operators', 'hc_real_operators', 'directory_listings'];
  
  let existingPhones = new Set();
  
  for (const table of tablesToCheck) {
      // Supabase lacks a universal phone filter easily string-matching variations,
      // so we select all records and filter in JS if the table is small, or use ilike.
      // Easiest is to select phone column where it's not null.
      const { data, error } = await supabase.from(table).select('phone').not('phone', 'is', null).limit(8000);
      if (error) {
        // Table might not exist, silently ignore
        continue;
      }
      if (data) {
        data.forEach(row => {
          if (row.phone) {
             existingPhones.add(normalize(row.phone));
          }
        });
      }
  }

  // Dedupe script
  let alreadyInDb = 0;
  let newOperators = [];

  rawExtractedSet.forEach(phone => {
      if (existingPhones.has(phone)) {
          alreadyInDb++;
      } else {
          newOperators.push(phone);
      }
  });

  console.log(`=> Step 2: Found ${existingPhones.size} total phone numbers populated across the Haul Command database.`);
  console.log(`=> Step 3: Deduplication Complete!`);
  console.log(`-----------------------------------`);
  console.log(`Total Scraped: ${rawExtractedSet.length}`);
  console.log(`Already In DB: ${alreadyInDb}`);
  console.log(`NEW Gained:    ${newOperators.length}`);
  
  // Generate SQL to save these somewhere temporarily or print it
  // But just printing is enough for the user right now since they asked "how many we actually gained"
}

checkPhoneNumbers().catch(console.error);
