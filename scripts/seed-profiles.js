
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProfiles() {
    console.log("👤 Seeding Test Profiles...");

    const profiles = [
        {
            id: "d1111111-1111-1111-1111-111111111111",
            display_name: "Tony Stallone",
            email: "tony@haulcommand.test",
            role: "driver",
            home_state: "FL",
            country: "USA"
        },
        {
            id: "d2222222-2222-2222-2222-222222222222",
            display_name: "Sarah Miller",
            email: "sarah@haulcommand.test",
            role: "driver",
            home_state: "TX",
            country: "USA"
        },
        {
            id: "d3333333-3333-3333-3333-333333333333",
            display_name: "Mike Power",
            email: "mike@haulcommand.test",
            role: "driver",
            home_state: "ON",
            country: "CAN"
        }
    ];

    const { error } = await supabase.from("profiles").upsert(profiles);
    if (error) {
        console.error("❌ Error seeding profiles:", error);
    } else {
        console.log(`✅ Seeded ${profiles.length} profiles.`);
    }
}

seedProfiles();
