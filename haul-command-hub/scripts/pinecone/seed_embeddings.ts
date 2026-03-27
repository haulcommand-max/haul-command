import "dotenv/config";
import { embedOperator, OperatorProfile } from "../../src/lib/pinecone/embed";
// In a real scenario, this would import Supabase client.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

/**
 * Seed Embeddings for 1.5M Operators.
 * Batching in chunks to prevent memory/rate-limiting issues.
 */
async function main() {
  console.log("Starting Step 3: Data Ingestion (Batch Embedding 1.5M Operator Entities)...");

  let startId = 0;
  const BATCH_SIZE = 500;
  let totalProcessed = 0;

  while (true) {
    // 1. Fetch from Supabase Directory
    const { data: operators, error } = await supabase
      .from('provider_directory')
      .select('operator_id, location, certifications, equipment_type, availability_status, price_sensitivity, tier') // etc. Add all fields
      .order('id')
      .range(startId, startId + BATCH_SIZE - 1);

    if (error || !operators || operators.length === 0) {
      console.log(`Finished processing ${totalProcessed} operators. Exiting.`);
      break;
    }

    // 2. Map and Embed in Parallel/Batches
    const embedPromises = operators.map(async (op: any) => {
      const profile: OperatorProfile = {
        operator_id: op.operator_id,
        location: op.location,
        certifications: op.certifications ? op.certifications.split(',') : [],
        equipment_type: op.equipment_type || 'Unknown',
        availability_status: op.availability_status || 'available',
        acceptance_rate: Math.floor(Math.random() * 40) + 60, // Simulate existing metric
        completion_rate: Math.floor(Math.random() * 30) + 70, // Simulate existing metric
        avg_response_time: Math.floor(Math.random() * 300) + 30, // Simulate existing metric
        preferred_job_types: ['Heavy Haul', 'Super Load'], 
        price_sensitivity: op.price_sensitivity || 5, // Scale 1-10
        reliability_score: Math.floor(Math.random() * 10) + 90, // Scale 1-100
        historical_routes: [], // To be populated by routing engine
        behavioral_tags: ['Fast Responder', 'Night Owl'], 
        last_active_timestamp: new Date().toISOString(),
        tier: op.tier || 'C', // A, B, C, D
      };
      
      try {
        await embedOperator(profile);
      } catch (err) {
        console.warn(`Failed to embed operator ${op.operator_id}:`, err);
      }
    });

    // Wait for the entire batch to complete
    await Promise.all(embedPromises);

    totalProcessed += operators.length;
    console.log(`Processed ${totalProcessed} operators...`);
    
    // Pagination offset
    startId += BATCH_SIZE;
  }

  console.log("Embedding sync complete!");
}

main().catch(err => {
  console.error("Fatal error during seeding:", err);
  process.exit(1);
});
