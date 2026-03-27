import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function generateTrustScores() {
  console.log('Running Trust Score Automation Engine...');
  
  // 1. Find entities without a trust score
  const { data: orphans, error: err1 } = await supabase
    .from('directory_listings')
    .select('id, alive_status')
    .is('trust_score_id', null)
    .limit(500); // Batched

  if (err1) {
    if (err1.code === '42703') { // missing column trust_score_id
      console.log('Migration not executed yet. Skipping Trust Score generator.');
      return;
    }
    console.error('Error fetching orphans:', err1);
    return;
  }

  if (!orphans || orphans.length === 0) {
    console.log('All entities have assigned Trust Scores. No action needed.');
    return;
  }

  console.log(`Assigning Trust Scores for ${orphans.length} entities...`);

  for (const entity of orphans) {
    // Determine baseline scoring
    // RULE: "Do not simulate or imply verified certifications."
    // Scraped profiles get baseline "system-generated preview" scores (0 for compliance until they upload proof)
    const isScraped = entity.alive_status === 'scraped';

    const newScore = {
      reliability_score: isScraped ? 50 : 80, // 50 = Estimated Base
      on_time_index: isScraped ? 50 : 80,
      compliance_score: 0, // 0 = Missing (must be User-Verified)
      comm_response_score: isScraped ? 30 : 90,
      dispute_risk_score: isScraped ? 50 : 10,
    };

    // Insert score
    const { data: scoreData, error: scoreErr } = await supabase
      .from('identity_scores')
      .insert(newScore)
      .select('id')
      .single();

    if (scoreErr) {
      // NOTE: If identity_scores rejects because identity_id is null, our database schema requires an identity first.
      console.error(`Failed to generate score for entity ${entity.id}:`, scoreErr.message);
      continue;
    }

    // Attach back to directory
    await supabase
      .from('directory_listings')
      .update({ 
        trust_score_id: scoreData.id,
        metadata: {
          generation_status: 'system-generated preview',
          certification_status: 'missing' // explicit missing states per user rule
        }
      })
      .eq('id', entity.id);
  }

  console.log('Task 2 Complete. Trust scores initialized.');
}

generateTrustScores().then(() => process.exit(0)).catch(console.error);
