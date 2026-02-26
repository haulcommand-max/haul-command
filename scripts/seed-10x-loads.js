
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sampleLoads = [
    {
        public_id: "L-10X-001",
        service_required: "Pilot Car (1)",
        origin_country: "US",
        origin_city: "Houston",
        origin_admin1: "TX",
        dest_country: "US",
        dest_city: "Orlando",
        dest_admin1: "FL",
        rate_amount: 3000,
        miles: 980,
        width: 12,
        height: 13.5,
        weight: 45000,
    },
    {
        public_id: "L-10X-002",
        service_required: "Superload (Escort + Police)",
        origin_country: "US",
        origin_city: "Birmingham",
        origin_admin1: "AL",
        dest_country: "US",
        dest_city: "Savannah",
        dest_admin1: "GA",
        rate_amount: 8500,
        miles: 450,
        width: 18,
        height: 16.5,
        weight: 185000,
    },
    {
        public_id: "L-10X-003",
        service_required: "Standard Oversize",
        origin_country: "US",
        origin_city: "Atlanta",
        origin_admin1: "GA",
        dest_country: "US",
        dest_city: "Tampa",
        dest_admin1: "FL",
        rate_amount: 1200,
        miles: 460,
        width: 10,
        height: 13.5,
        weight: 32000,
    },
    {
        public_id: "L-10X-004",
        service_required: "Low Rate Test",
        origin_country: "US",
        origin_city: "Dallas",
        origin_admin1: "TX",
        dest_country: "US",
        dest_city: "Austin",
        dest_admin1: "TX",
        rate_amount: 300,
        miles: 200,
        width: 8.5,
        height: 13.5,
        weight: 15000,
    }
];

async function seedLoads() {
    console.log("🚀 Seeding 10X Sample Loads...");

    const { data, error } = await supabase
        .from("loads")
        .insert(sampleLoads)
        .select();

    if (error) {
        console.error("❌ Error seeding loads:", error);
        return;
    }

    console.log(`✅ Seeded ${data.length} loads.`);

    // Initialize load_intel for these loads
    for (const load of data) {
        await supabase.from("load_intel").upsert({ load_id: load.id });
    }

    console.log("✅ Initialized load_intel records.");
}

seedLoads();
