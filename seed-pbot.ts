import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const slug = "autonomous-p-bot-gateway";
  const canonical_term = "Autonomous P-Bot Gateway";
  const short_definition = "A highly advanced logistics command node that manages the orchestration, dispatch, and telemetry for autonomous robotic escort vehicles (p-bots) guiding oversize loads.";
  const expanded_definition = "As heavy haul logistics moves toward autonomous freight, an Autonomous P-Bot Gateway acts as the central communication bridge between self-driving transport vehicles, traffic infrastructure, and human oversight. These gateways ensure that robotic pilot cars maintain exact spacing, relay real-time restriction data, and broadcast hazard warnings without delay. In the Haul Command Double Platinum ecosystem, this represents the vanguard of future-proof compliance.";

  // Upsert the topic first
  await supabase.from("glo_topics").upsert({
    slug: "autonomous-infrastructure",
    name: "Autonomous Infrastructure",
    description: "Systems and regulations governing self-driving and robotic heavy haul transport.",
    is_active: true
  });

  // Upsert the term
  const { data: termData, error: termError } = await supabase.from("glo_terms").upsert({
    slug,
    canonical_term,
    topic_primary_id: "autonomous-infrastructure",
    short_definition,
    plain_english: "The central brain that controls robot pilot cars.",
    expanded_definition,
    why_it_matters: "Without a secure gateway, autonomous escort vehicles cannot legally deploy. This node is critical for real-time safety and regulatory compliance.",
    is_active: true,
    is_indexable: true,
    source_count: 3,
    confidence_state: "verified_current",
    commercial_intent_level: 5 // high intent
  }).select("id").single();

  if (termError) {
    console.error("Error inserting term:", termError);
    return;
  }
  
  if (termData?.id) {
    console.log("Adding term metadata...", termData.id);
    
    // add aliases
    await supabase.from("glo_term_aliases").upsert({
      term_id: termData.id,
      alias: "P-Bot Controller"
    });

    // add use cases
    await supabase.from("glo_use_cases").upsert([
      { term_id: termData.id, use_case: "Routing automated pilot cars through port checkpoints" },
      { term_id: termData.id, use_case: "Providing telemetry for autonomous freight convoys" }
    ]);
    
    // link to another term if possible
    console.log("Seed complete!");
  }
}

seed();
