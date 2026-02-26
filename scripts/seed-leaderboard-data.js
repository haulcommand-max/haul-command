
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLeaderboard() {
    console.log("🏆 Seeding Leaderboard Events...");

    const { data: profiles, error: pError } = await supabase.from("profiles").select("id").limit(10);
    if (pError || !profiles.length) {
        console.error("❌ No profiles found to seed events for.");
        return;
    }

    const events = [];
    profiles.forEach((p, i) => {
        // Seed some mixed events
        events.push({
            driver_id: p.id,
            event_type: "JOB_COMPLETE",
            points: 100 + i * 20,
            meta: { load_id: "fake-load-id" },
            created_at: new Date().toISOString()
        });

        // Some older events for 30d vs Annual testing
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 45);
        events.push({
            driver_id: p.id,
            event_type: "CERT_VERIFIED",
            points: 50,
            meta: { cert: "Hazmat" },
            created_at: oldDate.toISOString()
        });
    });

    const { error: eError } = await supabase.from("rank_events").insert(events);
    if (eError) {
        console.error("❌ Error seeding rank_events:", eError);
    } else {
        console.log(`✅ Seeded ${events.length} rank events.`);

        // Refresh Leaderboards
        const { error: rError } = await supabase.rpc("refresh_national_leaderboard");
        if (rError) console.error("❌ Error refreshing leaderboard:", rError);
        else console.log("✨ Leaderboard Refreshed.");
    }
}

seedLeaderboard();
