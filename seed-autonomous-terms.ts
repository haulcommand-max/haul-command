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
  console.log("Seeding autonomous freight terms...");

  const terms = [
    {
      slug: "autonomous-truck",
      canonical_term: "Autonomous Truck",
      short_definition: "A commercial heavy vehicle capable of operating without direct human intervention under specific conditions or fully autonomously.",
      expanded_definition: "As of 2026, autonomous trucks are primarily operating at SAE Level 4 on mapped highway corridors (like Texas SH-130). They require advanced lidar, radar, and camera sensor suites. For oversize loads, pilot cars will increasingly communicate directly with the autonomous truck's AI brain via V2V (vehicle-to-vehicle) communication.",
      why_it_matters: "Heavy haul logistics will shift fundamentally as routine highway segments are handled by AVs, altering exactly how and where human pilot cars are required.",
      aliases: ["Driverless Truck", "Robotruck"]
    },
    {
      slug: "sae-levels-l0-l5",
      canonical_term: "SAE Levels (L0-L5)",
      short_definition: "The Society of Automotive Engineers standard defining the six levels of driving automation, from Level 0 (no automation) to Level 5 (full automation anywhere).",
      expanded_definition: "Currently, most commercial autonomous freight operates at Level 4 (High Automation), meaning the truck can drive itself under specific conditions (ODD - Operational Design Domain) like optimal weather and mapped highways without human fallback. Level 5 represents full automation in any condition, projected for commercial scale between 2030-2035.",
      why_it_matters: "Regulators and insurers base pilot car requirements on the specific SAE level of the load carrier. L4 trucks may still require human escorts at entry/exit ramps.",
      aliases: ["Levels of Driving Automation", "Automation Levels"]
    },
    {
      slug: "remote-operator",
      canonical_term: "Remote Operator",
      short_definition: "A human controller operating out of a remote command center who monitors, assists, or takes over the driving of an autonomous vehicle.",
      expanded_definition: "Also known as a teleoperator, this role is critical during edge-case scenarios where the AI encounters unfamiliar conditions (e.g., complex construction zones). Some states require a remote operator to be legally responsible for the autonomous vehicle.",
      why_it_matters: "A potential future career path for experienced pilot car drivers is to become remote digital escorts, monitoring multiple autonomous loads simultaneously.",
      aliases: ["Teleoperator", "Remote Guardian", "Digital Escort"]
    },
    {
      slug: "transfer-hub-model",
      canonical_term: "Transfer-Hub Model",
      short_definition: "A logistics strategy where human drivers handle first-mile and last-mile driving, while autonomous trucks handle the long-haul highway segment.",
      expanded_definition: "In this model, human drivers pick up a load from a shipper and drop it at a transfer hub adjacent to a highway. An autonomous truck then hauls it to another transfer hub near the destination, where another human takes it the rest of the way. This mitigates the complex urban driving problem for AVs.",
      why_it_matters: "Pilot cars will likely see job restructuring where they specialize either in highly complex human-driven urban segments or high-speed V2V-enabled highway escorting.",
      aliases: ["Hub-to-hub Model", "Transfer Station"]
    },
    {
      slug: "driver-in-loop",
      canonical_term: "Driver-in-the-Loop",
      short_definition: "An operational mode where a human driver acts as the primary controller or continuous supervisor of the automated system.",
      expanded_definition: "Unlike a fully autonomous system where the human can completely disengage (Driver-out-of-the-Loop), a driver-in-the-loop system requires the human to be constantly attentive and ready to take control within milliseconds. This is typical of Level 2 and Level 3 automation systems.",
      why_it_matters: "Determines liability and the legal necessity of backup safety personnel in the escort vehicle fleet.",
      aliases: ["DIL", "Human-in-the-Loop"]
    }
  ];

  // Ensure topic exists
  await supabase.from("glo_topics").upsert({
    slug: "autonomous-infrastructure",
    name: "Autonomous Logistics",
    description: "Systems and regulations governing self-driving and robotic heavy haul transport.",
    is_active: true
  });

  for (const t of terms) {
    const { data: termData, error: termError } = await supabase.from("glo_terms").upsert({
      slug: t.slug,
      canonical_term: t.canonical_term,
      topic_primary_id: "autonomous-infrastructure",
      short_definition: t.short_definition,
      expanded_definition: t.expanded_definition,
      why_it_matters: t.why_it_matters,
      is_active: true,
      is_indexable: true,
      source_count: 2,
      confidence_state: "verified_current",
      commercial_intent_level: 4
    }).select("id").single();

    if (termError) {
      console.error("Error inserting term", t.slug, termError);
      continue;
    }

    if (termData?.id && t.aliases) {
      for (const alias of t.aliases) {
        await supabase.from("glo_term_aliases").upsert({
          term_id: termData.id,
          alias: alias
        });
      }
    }
  }

  console.log("Autonomous terms seeded successfully.");
}

seed();
