import { createClient } from "npm:@supabase/supabase-js";

async function importSeeds() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://hvjyfyzotqobfkakjozp.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to run import");
        Deno.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const jsonText = await Deno.readTextFile("./scripts/seed/real_uspilotcars_seed.json");
    const rawData = JSON.parse(jsonText);

    console.log(`🚀 Read ${rawData.length} operators from JSON... separating into profiles and driver_profiles...`);

    const profiles = [];
    const driverProfiles = [];

    for (const o of rawData) {
        profiles.push({
            id: o.id,
            role: "driver",
            display_name: o.display_name,
            phone: o.phone_e164,
            email: o.email,
            home_city: o.home_base_city,
            home_state: o.home_base_state,
            home_country: o.country_code,
            created_at: o.created_at,
            updated_at: o.updated_at
        });

        driverProfiles.push({
            user_id: o.id,
            service_radius_miles: o.coverage_radius_miles,
            equipment_tags: Array.isArray(o.equipment_json) ? o.equipment_json : [],
            is_seeded: o.is_seeded,
            claim_hash: o.claim_hash,
            seeded_batch_id: o.seeded_batch_id,
            seeded_at: o.seeded_at,
            phone_hash: o.phone_hash,
            email_hash: o.email_hash,
            last_active_at: o.created_at,
            updated_at: o.updated_at
        });
    }

    const BATCH_SIZE = 100;

    console.log(`🚀 Starting profiles import...`);
    for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
        const batch = profiles.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from("profiles")
            .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

        if (error) {
            console.error(`❌ Profiles Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        } else {
            console.log(`✅ Profiles Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(profiles.length / BATCH_SIZE)} inserted`);
        }
    }

    console.log(`🚀 Starting driver_profiles import...`);
    for (let i = 0; i < driverProfiles.length; i += BATCH_SIZE) {
        const batch = driverProfiles.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from("driver_profiles")
            .upsert(batch, { onConflict: "user_id", ignoreDuplicates: false });

        if (error) {
            console.error(`❌ DriverProfiles Batch ${i / BATCH_SIZE + 1} failed:`, error.message);
        } else {
            console.log(`✅ DriverProfiles Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(driverProfiles.length / BATCH_SIZE)} inserted`);
        }
    }

    // Enqueue search indexing jobs
    console.log(`📇 Enqueuing search index jobs...`);
    const searchJobs = driverProfiles.map(o => ({
        table_name: "driver_profiles",
        record_id: o.user_id,
        operation: "UPSERT",
        status: "pending",
        attempts: 0,
    }));

    for (let i = 0; i < searchJobs.length; i += BATCH_SIZE) {
        const batch = searchJobs.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from("search_jobs").insert(batch);
        if (error) console.error(`⚠️ Search job batch failed:`, error.message);
    }

    console.log(`\n✅ Done! ${profiles.length} real operators completely imported.`);
    console.log(`   Run search-indexer to sync to Typesense.`);
}

importSeeds();
