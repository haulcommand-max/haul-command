import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Parse Root Environment variables for true API access.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Gemini promised real data. This is the script that calls the exact 
// Google Places API to extract verified business phone numbers globally,
// completely replacing the simulated datasets.
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * THE REAL-WORLD ENTITY ENRICHER
 * 
 * Flow:
 * 1. Pulls empty or "unverified" profiles in the requested region.
 * 2. Executes a Google Places textSearch / textsearch query using the exact
 *    business name, city, and state to find the 'place_id'.
 * 3. Uses placeDetails to retrieve the formatted_phone_number and national_phone_number.
 * 4. Pushes the TRUE phone number back into the directory_listings JSON.
 * 5. Changes validation status from 'missing/pending' to 'google_verified'.
 */
async function verifyAndEnrichPhoneNumbers() {
  if (!GOOGLE_API_KEY) {
    console.error("🚨 CRITICAL: GOOGLE_MAPS_API_KEY missing from .env.local.");
    return;
  }

  // Define Google Places REST Client using local 'googleapis' package
  const places = google.places({ version: 'v1', auth: GOOGLE_API_KEY });

  console.log("🔍 Extracting unverified profiles from Supabase for real-time validation...");
  
  // Pull a batch of profiles where we either don't have a phone, 
  // or it needs Google Verification.
  const { data: profiles, error } = await supabase
    .from('directory_listings')
    .select('id, name, city, region_code, country_code, metadata')
    .eq('metadata->>coverage_status', 'unverified')
    .limit(100);

  if (error || !profiles || profiles.length === 0) {
    console.log("✅ All profiles in batch are verified. Awaiting new extractions.");
    return;
  }

  console.log(`📡 Connecting to Google Places API for ${profiles.length} real businesses...`);

  let count = 0;

  for (const p of profiles) {
    try {
      // 1. Search Google for the true Place ID based on Name + City
      const queryStr = `${p.name} ${p.city} ${p.region_code} ${p.country_code}`;
      const searchRes = await places.places.searchText({
        requestBody: {
          textQuery: queryStr,
        },
        fields: 'places.id,places.displayName'
      });

      const matchedPlaces = searchRes.data.places;
      if (!matchedPlaces || matchedPlaces.length === 0) {
        // Flag profile as "not verified / dead"
        continue;
      }

      // 2. We found a match. Get the absolute real phone number.
      const realPlaceId = matchedPlaces[0].id;
      
      const detailsRes = await places.places.get({
        name: `places/${realPlaceId}`,
        fields: 'internationalPhoneNumber,nationalPhoneNumber,businessStatus'
      });

      const verifiedPhone = detailsRes.data.internationalPhoneNumber || detailsRes.data.nationalPhoneNumber;

      if (verifiedPhone) {
        // 3. Update the Database with the TRUE E.164 phone number.
        const updatedMeta = {
          ...p.metadata,
          phone: verifiedPhone,
          coverage_status: 'google_verified',
          place_id: realPlaceId,
          business_status: detailsRes.data.businessStatus
        };

        const { error: patchErr } = await supabase
          .from('directory_listings')
          .update({ metadata: updatedMeta })
          .eq('id', p.id);

        if (!patchErr) {
          console.log(`✅ [${p.name}] - Real phone found: ${verifiedPhone}`);
          count++;
        }
      }
    } catch (err) {
      console.error(`❌ Failed to verify ${p.name}`);
    }
  }

  console.log(`\n🎉 BATCH COMPLETE: Successfully verified and extracted ${count} REAL phone numbers from Google Places.`);
}

verifyAndEnrichPhoneNumbers();
